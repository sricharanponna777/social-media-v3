
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { useTheme } from '@react-navigation/native';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

export default function MaterialTopTabsLayout() {
  const { colors } = useTheme();

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: 'grey',
        tabBarLabelStyle: { fontSize: 14 },
      }}
    >
        <MaterialTopTabs.Screen name="login" options={{ tabBarLabel: 'Login' }} />
        <MaterialTopTabs.Screen name="register" options={{ tabBarLabel: 'Signup' }} />
    </MaterialTopTabs>
  );
}
