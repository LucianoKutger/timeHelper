import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';
import { loadStoredMessages, saveStoredMessages } from './messageStorage';
import type { Message } from './messages';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

const storedMessage: Message = {
  id: 'message-id',
  message: 'Heute gearbeitet',
  response: 'Arbeitstag angelegt für den 2026-07-23 wurde angelegt',
  work_date: '2026-07-23',
  created_at: '2026-07-23T17:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { user: { id: 'user-123' } } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
});

test('loads only valid messages from the current user storage', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([storedMessage, { id: 'invalid' }]));

  await expect(loadStoredMessages()).resolves.toEqual([storedMessage]);
  expect(AsyncStorage.getItem).toHaveBeenCalledWith('timehelper:chat-messages:v1:user-123');
});

test('stores messages separately for the current user', async () => {
  await saveStoredMessages([storedMessage]);

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('timehelper:chat-messages:v1:user-123', JSON.stringify([storedMessage]));
});
