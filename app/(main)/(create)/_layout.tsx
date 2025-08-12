
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
        <MaterialTopTabs.Screen name="post" options={{ tabBarLabel: 'Create Post' }} />
        <MaterialTopTabs.Screen name="story" options={{ tabBarLabel: 'Create Story' }} />
        <MaterialTopTabs.Screen name="reel" options={{ tabBarLabel: 'Create Reel' }} />
    </MaterialTopTabs>
  );
}
