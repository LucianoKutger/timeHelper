import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { ExpoSpeechRecognitionModule, type ExpoSpeechRecognitionResultEvent, useSpeechRecognitionEvent } from 'expo-speech-recognition';

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

jest.mock('../../../api/httpClient', () => ({
  apiFetch: jest.fn(() => Promise.resolve({ status: 'ok' })),
}));

beforeEach(() => jest.clearAllMocks());

test('renders the command input', async () => {
  const view = await render(<CommandScreen />);
  const input = view.getByPlaceholderText('Arbeitszeit hinzufügen …');
  expect(input).toBeTruthy();
  expect(input.props.multiline).toBe(true);
  expect(view.getByTestId('chat-keyboard-view')).toBeTruthy();
  expect(view.getByText('Für Juli 2026 wurden keine Nachrichten gefunden.')).toBeTruthy();
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

test('shows only the ten messages from the selected month', async () => {
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await user.press(view.getByLabelText('Monat auswählen'));
  await user.press(view.getByText('Juni 2026'));

  expect(view.getAllByTestId('chat-message')).toHaveLength(10);
  expect(view.getByText('Arbeitstag für den 29.06.2026 erfolgreich eingetragen.')).toBeTruthy();
  expect(view.queryByText('Arbeitstag für den 20.05.2026 erfolgreich eingetragen.')).toBeNull();
});

test('switches the chat from the burger menu', async () => {
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await user.press(view.getByLabelText('Navigation öffnen'));
  await user.press(view.getByLabelText('Chat für Mai 2026 öffnen'));

  expect(view.queryByTestId('navigation-drawer')).toBeNull();
  expect(view.getAllByTestId('chat-message')).toHaveLength(10);
  expect(view.getByText('Arbeitstag für den 20.05.2026 erfolgreich eingetragen.')).toBeTruthy();
  expect(view.queryByText('Arbeitstag für den 29.06.2026 erfolgreich eingetragen.')).toBeNull();
});

test('opens the designed overlay states', async () => {
  const view = await render(<CommandScreen />);
  const user = userEvent.setup();

  await user.press(view.getByLabelText('Monat auswählen'));
  expect(view.getByTestId('month-menu')).toBeTruthy();

  await user.press(view.getByLabelText('Navigation öffnen'));
  expect(view.getByTestId('navigation-drawer')).toBeTruthy();

  await user.press(view.getByText('Juli 2026 abschließen'));
  expect(view.getByTestId('month-close-modal')).toBeTruthy();

  await user.press(view.getByText('Abschließen'));
  await user.press(view.getByLabelText('Spracheingabe starten'));
  expect(view.getByPlaceholderText('Sprache wird transkribiert …')).toBeTruthy();
  expect(ExpoSpeechRecognitionModule.requestPermissionsAsync).toHaveBeenCalledTimes(1);
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
      results: [
        {
          confidence: 1,
          segments: [],
          transcript: 'Heute von neun bis fünf',
        },
      ],
    });
  });

  await act(async () => {
    resultHandler?.({
      isFinal: false,
      results: [
        {
          confidence: 1,
          segments: [],
          transcript: 'im Büro',
        },
      ],
    });
  });

  expect(view.getByDisplayValue('Heute von neun bis fünf im Büro')).toBeTruthy();
});
