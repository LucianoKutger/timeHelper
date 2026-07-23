import { apiFetch } from './httpClient';
import { supabase } from '../lib/supabase';

jest.mock('../config/env', () => ({
  env: { apiUrl: 'http://localhost:8000' },
}));

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = fetchMock as typeof fetch;
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'access-token' } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
});

test('sends JSON requests with the current Supabase bearer token', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ response_massage: 'Gespeichert' }),
  });

  await expect(
    apiFetch('/v1/workday/', {
      method: 'POST',
      body: JSON.stringify({ message: 'Heute gearbeitet' }),
    }),
  ).resolves.toEqual({ response_massage: 'Gespeichert' });

  const [, request] = fetchMock.mock.calls[0];
  expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/v1/workday/', expect.objectContaining({ method: 'POST' }));
  expect((request.headers as Headers).get('Authorization')).toBe('Bearer access-token');
  expect((request.headers as Headers).get('Content-Type')).toBe('application/json');
});

test('surfaces structured backend error messages', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: jest.fn().mockResolvedValue({ detail: { message: 'Für diesen Tag existiert bereits ein Arbeitstag.' } }),
  });

  await expect(apiFetch('/v1/workday/')).rejects.toThrow('Für diesen Tag existiert bereits ein Arbeitstag.');
});
