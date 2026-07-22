import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { supabase } from '../../../lib/supabase';
import { colors, radii } from '../../../theme';

type SettingsScreenProps = {
  onBack?: () => void;
};

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Zurück" hitSlop={12} onPress={onBack} style={styles.backButton}>
          <Feather color={colors.text} name="arrow-left" size={21} />
        </Pressable>
        <Text style={styles.title}>Einstellungen</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>Zeitzone</Text>
            <Text style={styles.rowSubtitle}>Europe/Berlin</Text>
          </View>
          <Feather color={colors.textMuted} name="chevron-right" size={19} />
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>Arbeitszeit-Aliase</Text>
            <Text style={styles.rowSubtitle}>Persönliche Kürzel verwalten</Text>
          </View>
          <Feather color={colors.textMuted} name="chevron-right" size={19} />
        </View>
      </View>

      <Pressable onPress={() => void supabase.auth.signOut()} style={styles.signOutButton}>
        <Feather color={colors.danger} name="log-out" size={17} />
        <Text style={styles.signOutText}>Abmelden</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  card: {
    overflow: 'hidden',
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowSubtitle: { marginTop: 5, color: colors.textMuted, fontSize: 11 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16, backgroundColor: colors.border },
  signOutButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 'auto',
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: '#482334',
    backgroundColor: '#1B1017',
  },
  signOutText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
