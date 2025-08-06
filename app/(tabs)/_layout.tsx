import { Tabs } from 'expo-router'
import React from 'react'
import { useColorScheme } from '@/hooks/useColorScheme'

const TabLayout = () => {
  const colorScheme = useColorScheme()

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarActiveTintColor: colorScheme === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)',
      tabBarInactiveTintColor: colorScheme === 'dark' ? 'white' : 'black',
    }}>
        <Tabs.Screen name="feed" options={{ tabBarLabel: 'Feed' }} />
        <Tabs.Screen name="friends" options={{ tabBarLabel: 'Friends' }} />
        <Tabs.Screen name="reels" options={{ tabBarLabel: 'Reels' }} />
        <Tabs.Screen name="profile" options={{ tabBarLabel: 'Profile' }} />
        <Tabs.Screen name="notifications" options={{ tabBarLabel: 'Activity' }} />
        <Tabs.Screen name="menu" options={{ tabBarLabel: 'Menu' }} />
    </Tabs>
  )
}

export default TabLayout