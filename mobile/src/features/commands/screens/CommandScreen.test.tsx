import { render, userEvent } from '@testing-library/react-native';

import { CommandScreen } from './CommandScreen';

jest.mock('../../../api/httpClient', () => ({
  apiFetch: jest.fn(() => Promise.resolve({ status: 'ok' })),
}));

test('renders the command input', async () => {
  const view = await render(<CommandScreen />);
  expect(view.getByPlaceholderText('Arbeitszeit hinzufügen …')).toBeTruthy();
  expect(view.getByText('Für Juli 2026 wurden keine Nachrichten gefunden.')).toBeTruthy();
  expect(view.queryAllByTestId('chat-message')).toHaveLength(0);
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
});
