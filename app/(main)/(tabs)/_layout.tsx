import { Tabs, useRouter } from 'expo-router'
import React from 'react'
import { useColorScheme } from '@/hooks/useColorScheme'
import { View, Text, TouchableOpacity } from 'react-native'
import { AlignJustify, Bell, Ellipsis, Home, LogOut, MessageCircle, Pencil, Plus, Search, Settings, User, Users, Video } from 'lucide-react-native'
import { useAuth } from '@/contexts/AuthContext'

const TabLayout = () => {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const { removeToken } = useAuth()
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colorScheme === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)',
        tabBarInactiveTintColor: colorScheme === 'dark' ? 'white' : 'black',
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          tabBarLabel: 'Feed',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 10 }}>
              <Text>Home</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity style={{ padding: 10 }} onPress={() => router.push('/(main)/(create)/post')}>
                <Plus size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <MessageCircle size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          tabBarLabel: 'Friends',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 10 }}>
              <Text>Friends</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={{ padding: 10 }}>
              <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reels/index"
        options={{
          tabBarLabel: 'Reels',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text>For You</Text>
              <Text>Explore</Text>
            </View>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity style={{ padding: 10 }}>
                <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <User size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarLabel: 'Profile',
          headerTransparent: true,
          headerTitle: '',
          headerRight: () => (
            <>
              <TouchableOpacity style={{ padding: 10 }}>
                <Pencil size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <LogOut
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                  onPress={async () => {
                    removeToken()
                    router.replace('/')
                  }}
                />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          tabBarLabel: 'Activity',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 10 }}>
              <Text>Notifications</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity style={{ padding: 10 }}>
                <Ellipsis size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu/index"
        options={{
          tabBarLabel: 'Menu',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={{ padding: 10 }}>
              <Text>Menu</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity style={{ padding: 10 }}>
                <Settings size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 10 }}>
                <Search size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => <AlignJustify size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}

export default TabLayout
