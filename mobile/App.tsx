import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './src/providers/AppProviders';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { useAuthSession } from './src/hooks/useAuthSession';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { session, loading } = useAuthSession();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <RootNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <AppContent />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
