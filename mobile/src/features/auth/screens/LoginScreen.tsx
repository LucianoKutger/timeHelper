import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput } from 'react-native';

import { Screen } from '../../../components/Screen';
import { supabase } from '../../../lib/supabase';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  return (
    <Screen>
      <Text style={styles.title}>timeHelper</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-Mail" autoCapitalize="none" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Passwort" secureTextEntry />
      <Button title="Anmelden" onPress={() => void signIn()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700' },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 14 },
});
