import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { colors, radii } from '../../../theme';

export function ReportsScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Monatsabschluss</Text>
        <Text style={styles.subtitle}>Zeitraum prüfen und Vorgang starten.</Text>

        <Text style={styles.label}>JAHR</Text>
        <View style={styles.field}>
          <Text style={styles.value}>2026</Text>
        </View>

        <Text style={styles.label}>MONAT</Text>
        <View style={styles.field}>
          <Text style={styles.value}>Juli</Text>
          <Feather color={colors.textMuted} name="chevron-down" size={16} />
        </View>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Abschließen</Text>
        </Pressable>
      </View>
      <Text style={styles.footnote}>Der Abschluss kann einen Moment dauern.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 120,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 7, marginBottom: 26, color: colors.textMuted, fontSize: 11 },
  label: { marginTop: 18, marginBottom: 9, color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#0E121A',
  },
  value: { color: colors.text, fontSize: 13 },
  button: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: radii.medium, backgroundColor: colors.primary },
  buttonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  footnote: { textAlign: 'center', color: colors.textFaint, fontSize: 9 },
});
