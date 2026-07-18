import { Button, Text } from 'react-native';

import { Screen } from '../../../components/Screen';
import { supabase } from '../../../lib/supabase';

export function SettingsScreen() {
  return (
    <Screen>
      <Text>Profil, Zeitzone und Alias-Konfiguration.</Text>
      <Button title="Abmelden" onPress={() => void supabase.auth.signOut()} />
    </Screen>
  );
}
