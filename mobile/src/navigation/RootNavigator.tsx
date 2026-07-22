import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CommandScreen } from '../features/commands/screens/CommandScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { colors } from '../theme';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="Home">
          {({ navigation }) => <CommandScreen onOpenSettings={() => navigation.navigate('Settings')} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {({ navigation }) => <SettingsScreen onBack={() => navigation.goBack()} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
