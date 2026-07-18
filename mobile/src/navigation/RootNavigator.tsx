import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import { CommandScreen } from '../features/commands/screens/CommandScreen';
import { ReportsScreen } from '../features/reports/screens/ReportsScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { WorkDaysScreen } from '../features/workDays/screens/WorkDaysScreen';

const Tabs = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tabs.Navigator screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="Erfassen" component={CommandScreen} />
        <Tabs.Screen name="Monat" component={WorkDaysScreen} />
        <Tabs.Screen name="Reports" component={ReportsScreen} />
        <Tabs.Screen name="Einstellungen" component={SettingsScreen} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
