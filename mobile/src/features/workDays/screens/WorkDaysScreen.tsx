import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/Screen';
import { colors, radii } from '../../../theme';

const months = ['Juli 2026', 'Juni 2026', 'Mai 2026', 'April 2026'];

export function WorkDaysScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>VERLAUF</Text>
      <View style={styles.list}>
        {months.map((month, index) => (
          <View key={month} style={[styles.row, index === 0 && styles.activeRow]}>
            <Text style={styles.month}>{month}</Text>
            {index === 0 ? <Text style={styles.current}>Aktuell</Text> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  list: { overflow: 'hidden', borderRadius: radii.medium, backgroundColor: colors.surface },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activeRow: { backgroundColor: '#30274F' },
  month: { color: colors.text, fontSize: 14 },
  current: { color: '#A99BFF', fontSize: 10 },
});
