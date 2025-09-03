import { Tabs, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { useColorScheme } from '@/hooks/useColorScheme'
import { TouchableOpacity, View } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { AlignJustify, Bell, Ellipsis, Home, LogOut, MessageCircle, Pencil, Plus, Search, Settings, User, Users, Video } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { TabsList, TabsTrigger, Tabs as TabsComponent } from '@/components/ui/tabs'
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
            <Text className='m-2.5'>Home</Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={Home} size={size} color={color} />
          ),
          headerRight: () => (
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="p-2.5"
                onPress={() => router.push('/(main)/(create)/post')}
              >
                <Icon
                  as={Plus}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5" onPress={() => router.push('/(main)/(chats)/main')}>
                <Icon
                  as={MessageCircle}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          tabBarLabel: 'Friends',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity className="p-2.5">
              <Text className='text-black dark:text-white'>Friends</Text>
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={Users} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels/index"
        options={{
          tabBarLabel: 'Reels',
          headerTitle: '',
          headerTransparent: true,
          headerRight: () => (
            <>
              <TouchableOpacity className="p-2.5" onPress={() => router.push('/(main)/(create)/reel')}>
                <Icon
                  as={Plus}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Search}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={User}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={Video} size={size} color={color} />
          ),
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
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Pencil}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Search}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={LogOut}
                  size={24}
                  onPress={async () => {
                    removeToken()
                    router.replace('/')
                  }}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={User} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          tabBarLabel: 'Activity',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity className="p-2.5">
              <Text>Notifications</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Ellipsis}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Search}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={Bell} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu/index"
        options={{
          tabBarLabel: 'Menu',
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity className="p-2.5">
              <Text>Menu</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Settings}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5">
                <Icon
                  as={Search}
                  size={24}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                />
              </TouchableOpacity>
            </>
          ),
          tabBarIcon: ({ color, size }) => (
            <Icon as={AlignJustify} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabLayout
