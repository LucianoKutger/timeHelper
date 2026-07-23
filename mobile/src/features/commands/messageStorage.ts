import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';
import type { Message } from './messages';

const storageKeyPrefix = 'timehelper:chat-messages:v1';

function isStoredMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<Message>;
  return (
    typeof message.id === 'string' &&
    typeof message.message === 'string' &&
    typeof message.response === 'string' &&
    typeof message.work_date === 'string' &&
    typeof message.created_at === 'string'
  );
}

async function currentUserStorageKey() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const userId = data.session?.user.id;
  if (!userId) throw new Error('Keine aktive Sitzung für die lokale Chat-Historie gefunden.');
  return `${storageKeyPrefix}:${userId}`;
}

export async function loadStoredMessages() {
  const storedValue = await AsyncStorage.getItem(await currentUserStorageKey());
  if (!storedValue) return [];

  const parsedValue: unknown = JSON.parse(storedValue);
  return Array.isArray(parsedValue) ? parsedValue.filter(isStoredMessage) : [];
}

export async function saveStoredMessages(messages: Message[]) {
  await AsyncStorage.setItem(await currentUserStorageKey(), JSON.stringify(messages));
}
