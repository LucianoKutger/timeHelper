import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';

import { apiFetch } from '../../../api/httpClient';
import { Screen } from '../../../components/Screen';
import type { ApiResponse } from '../../../types/api';

export function CommandScreen() {
  const [message, setMessage] = useState('');
  const [backendState, setBackendState] = useState<'waking' | 'ready' | 'error'>('waking');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ status: string }>('/health')
      .then(() => setBackendState('ready'))
      .catch(() => setBackendState('error'));
  }, []);

  const preview = async () => {
    const payload = await apiFetch<ApiResponse<Record<string, unknown>>>('/v1/commands/preview', {
      method: 'POST',
      body: JSON.stringify({
        request_id: Crypto.randomUUID(),
        message,
        client_timezone: 'Europe/Berlin',
      }),
    });
    setResult(payload.message ?? payload.status);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Arbeitszeit erfassen</Text>
        <Text>Backend: {backendState}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="z. B. Heute 8:15 bis 16:45, 30 Minuten Pause, Büro"
        multiline
      />
      <Button title="Vorschau erstellen" disabled={!message.trim()} onPress={() => void preview()} />
      {result ? <Text>{result}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '700' },
  input: { minHeight: 130, backgroundColor: 'white', borderRadius: 12, padding: 14, textAlignVertical: 'top' },
});
