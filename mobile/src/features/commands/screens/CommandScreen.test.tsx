import { act, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule, type ExpoSpeechRecognitionResultEvent, useSpeechRecognitionEvent } from 'expo-speech-recognition';

import { apiFetch } from '../../../api/httpClient';
import { loadStoredMessages, saveStoredMessages } from '../messageStorage';
import type { Message } from '../messages';
import { CommandScreen } from './CommandScreen';

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    abort: jest.fn(),
    isRecognitionAvailable: jest.fn(() => true),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    start: jest.fn(),
    stop: jest.fn(),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'generated-message-id'),
}));

jest.mock('../../../api/httpClient', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('../messageStorage', () => ({
  loadStoredMessages: jest.fn(),
  saveStoredMessages: jest.fn(),
}));

const storedMessages: Message[] = [
  {
    id: 'june-message',
    message: 'Im Juni gearbeitet',
    response: 'Arbeitstag angelegt für den 2026-06-29 wurde angelegt',
    work_date: '2026-06-29',
    created_at: '2026-06-29T17:00:00.000Z',
  },
  {
    id: 'may-message',
    message: 'Im Mai gearbeitet',
    response: 'Arbeitstag angelegt für den 2026-05-20 wurde angelegt',
    work_date: '2026-05-20',
    created_at: '2026-05-20T17:00:00.000Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadStoredMessages).mockResolvedValue([]);
  jest.mocked(saveStoredMessages).mockResolvedValue();
  jest.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === '/health') return { status: 'ok' };
    throw new Error(`Unexpected API request: ${path}`);
  });
});

test('renders an empty persistent chat and multiline composer', async () => {
  const view = await render(<CommandScreen />);
  const input = view.getByPlaceholderText('Arbeitszeit hinzufügen …');

  expect(input.props.multiline).toBe(true);
  expect(view.getByTestId('chat-keyboard-view')).toBeTruthy();
  await waitFor(() => expect(view.getByText('Für Juli 2026 wurden keine Nachrichten gefunden.')).toBeTruthy());
  expect(loadStoredMessages).toHaveBeenCalledTimes(1);
  expect(view.queryAllByTestId('chat-message')).toHaveLength(0);
});

test('grows the composer with multiple lines up to its maximum height', async () => {
  const view = await render(<CommandScreen />);
  const input = view.getByLabelText('Arbeitszeit hinzufügen');

  await act(async () => {
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { height: 96, width: 200 } },
    });
  });
  expect(view.getByLabelText('Arbeitszeit hinzufügen').props.style).toEqual(expect.arrayContaining([{ height: 96 }]));

  await act(async () => {
    fireEvent(input, 'contentSizeChange', {
      nativeEvent: { contentSize: { height: 300, width: 200 } },
    });
  });
  expect(view.getByLabelText('Arbeitszeit hinzufügen').props.style).toEqual(expect.arrayContaining([{ height: 144 }]));
});

test('filters locally stored chats by month', async () => {
  jest.mocked(loadStoredMessages).mockResolvedValue(storedMessages);
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.press(view.getByLabelText('Monat auswählen'));
  await user.press(view.getByText('Juni 2026'));

  expect(view.getAllByTestId('chat-message')).toHaveLength(1);
  expect(view.getByText('Arbeitstag angelegt für den 2026-06-29 wurde angelegt')).toBeTruthy();
  expect(view.queryByText('Arbeitstag angelegt für den 2026-05-20 wurde angelegt')).toBeNull();
});

test('switches a locally stored chat from the navigation drawer', async () => {
  jest.mocked(loadStoredMessages).mockResolvedValue(storedMessages);
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.press(view.getByLabelText('Navigation öffnen'));
  await user.press(view.getByLabelText('Chat für Mai 2026 öffnen'));

  expect(view.queryByTestId('navigation-drawer')).toBeNull();
  expect(view.getAllByTestId('chat-message')).toHaveLength(1);
  expect(view.getByText('Arbeitstag angelegt für den 2026-05-20 wurde angelegt')).toBeTruthy();
});

test('sends a workday request and persists its request-response pair', async () => {
  let resolveWorkdayRequest: ((value: { response_massage: string }) => void) | undefined;
  jest.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === '/health') return { status: 'ok' };
    if (path === '/v1/workday/') return new Promise((resolve) => (resolveWorkdayRequest = resolve));
    throw new Error(`Unexpected API request: ${path}`);
  });
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.type(view.getByLabelText('Arbeitszeit hinzufügen'), 'Heute von 9 bis 17 Uhr gearbeitet');
  await user.press(view.getByLabelText('Eintrag senden'));

  expect(view.getByText('Heute von 9 bis 17 Uhr gearbeitet')).toBeTruthy();
  expect(view.getByLabelText('Timehelper antwortet …')).toBeTruthy();
  expect(saveStoredMessages).not.toHaveBeenCalled();

  await act(async () => {
    resolveWorkdayRequest?.({ response_massage: 'Arbeitstag angelegt für den 2026-07-23 wurde angelegt' });
  });
  expect(saveStoredMessages).toHaveBeenCalledTimes(1);
  expect(view.queryByText('Arbeitstag angelegt für den 2026-07-23 wurde angelegt')).toBeNull();
  await waitFor(() => expect(view.getByText('Arbeitstag angelegt für den 2026-07-23 wurde angelegt')).toBeTruthy());
  expect(apiFetch).toHaveBeenCalledWith('/v1/workday/', {
    method: 'POST',
    body: JSON.stringify({ message: 'Heute von 9 bis 17 Uhr gearbeitet' }),
  });
  expect(saveStoredMessages).toHaveBeenCalledWith([
    expect.objectContaining({
      message: 'Heute von 9 bis 17 Uhr gearbeitet',
      response: 'Arbeitstag angelegt für den 2026-07-23 wurde angelegt',
      work_date: '2026-07-23',
    }),
  ]);
});

test('keeps a failed workday visible and retries it without persisting the failure', async () => {
  let workdayAttempts = 0;
  jest.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === '/health') return { status: 'ok' };
    if (path === '/v1/workday/' && workdayAttempts++ > 0) {
      return { response_massage: 'Arbeitstag für den 2026-07-23 wurde angelegt' };
    }
    throw new Error('Für diesen Tag existiert bereits ein Arbeitstag.');
  });
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.type(view.getByLabelText('Arbeitszeit hinzufügen'), 'Doppelter Eintrag');
  await user.press(view.getByLabelText('Eintrag senden'));

  await waitFor(() => expect(view.getByText('Für diesen Tag existiert bereits ein Arbeitstag.')).toBeTruthy());
  expect(view.getByText('Doppelter Eintrag')).toBeTruthy();
  expect(view.getByLabelText('Nachricht erneut senden')).toBeTruthy();
  expect(view.getByDisplayValue('')).toBeTruthy();
  expect(saveStoredMessages).not.toHaveBeenCalled();

  await user.press(view.getByLabelText('Nachricht erneut senden'));
  await waitFor(() => expect(saveStoredMessages).toHaveBeenCalledWith([expect.objectContaining({ message: 'Doppelter Eintrag' })]));
});

test('submits the selected year and month to monthly close', async () => {
  let resolveMonthlyCloseRequest: ((value: { response_message: string }) => void) | undefined;
  jest.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === '/health') return { status: 'ok' };
    if (path === '/v1/monthly_close/') return new Promise((resolve) => (resolveMonthlyCloseRequest = resolve));
    throw new Error(`Unexpected API request: ${path}`);
  });
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.press(view.getByLabelText('Navigation öffnen'));
  await user.press(view.getByText('Juli 2026 abschließen'));
  fireEvent.changeText(view.getByLabelText('Jahr für Monatsabschluss'), '2025');
  await user.press(view.getByLabelText('Monat für Monatsabschluss auswählen'));
  await user.press(view.getByText('März'));
  await user.press(view.getByLabelText('Monatsabschluss erstellen'));

  expect(view.getByTestId('month-close-modal')).toBeTruthy();
  expect(view.getByLabelText('Monatsabschluss schließen').props.accessibilityState).toEqual({ disabled: true });
  await act(async () => {
    resolveMonthlyCloseRequest?.({ response_message: 'Monatsabschluss erfolgreich erstellt' });
  });
  await waitFor(() => expect(view.getByText('Monatsabschluss erfolgreich erstellt')).toBeTruthy());
  expect(apiFetch).toHaveBeenCalledWith('/v1/monthly_close/', {
    method: 'POST',
    body: JSON.stringify({ year: 2025, month: 3 }),
  });
  await waitFor(() => expect(view.queryByTestId('month-close-modal')).toBeNull(), { timeout: 2000 });
});

test('keeps the monthly close modal open after an error', async () => {
  jest.mocked(apiFetch).mockImplementation(async (path) => {
    if (path === '/health') return { status: 'ok' };
    throw new Error('Monatsabschluss fehlgeschlagen.');
  });
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await waitFor(() => expect(loadStoredMessages).toHaveBeenCalled());
  await user.press(view.getByLabelText('Navigation öffnen'));
  await user.press(view.getByText('Juli 2026 abschließen'));
  await user.press(view.getByLabelText('Monatsabschluss erstellen'));

  await waitFor(() => expect(view.getByText('Monatsabschluss fehlgeschlagen.')).toBeTruthy());
  expect(view.getByTestId('month-close-modal')).toBeTruthy();
  expect(view.getByLabelText('Monatsabschluss schließen').props.accessibilityState).toEqual({ disabled: false });
});

test('starts continuous speech recognition and stops it from the same button', async () => {
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await user.press(view.getByLabelText('Spracheingabe starten'));
  expect(view.getByPlaceholderText('Sprache wird transkribiert …')).toBeTruthy();
  expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith(expect.objectContaining({ lang: 'de-DE', interimResults: true, continuous: true }));

  await user.press(view.getByLabelText('Spracheingabe beenden'));
  expect(ExpoSpeechRecognitionModule.stop).toHaveBeenCalledTimes(1);
});

test('keeps and combines multiple native speech segments in the composer', async () => {
  const view = await render(<CommandScreen />);
  const resultHandler = jest.mocked(useSpeechRecognitionEvent).mock.calls.find(([eventName]) => eventName === 'result')?.[1] as ((event: ExpoSpeechRecognitionResultEvent) => void) | undefined;

  await act(async () => {
    resultHandler?.({
      isFinal: true,
      results: [{ confidence: 1, segments: [], transcript: 'Heute von neun bis fünf' }],
    });
  });
  await act(async () => {
    resultHandler?.({
      isFinal: false,
      results: [{ confidence: 1, segments: [], transcript: 'im Büro' }],
    });
  });

  expect(view.getByDisplayValue('Heute von neun bis fünf im Büro')).toBeTruthy();
});
