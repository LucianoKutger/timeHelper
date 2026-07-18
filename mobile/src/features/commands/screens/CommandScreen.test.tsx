import { render } from '@testing-library/react-native';

import { CommandScreen } from './CommandScreen';

jest.mock('../../../api/httpClient', () => ({
  apiFetch: jest.fn(() => Promise.resolve({ status: 'ok' })),
}));

test('renders the command input', async () => {
  const view = await render(<CommandScreen />);
  expect(view.getByText('Arbeitszeit erfassen')).toBeTruthy();
});
