import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './src/providers/AppProviders';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { useAuthSession } from './src/hooks/useAuthSession';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

function AppContent() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return session ? <RootNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <AppContent />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
