import { Tabs } from 'expo-router'
import React from 'react'
import { useColorScheme } from '@/hooks/useColorScheme'
import { View } from '@/components/ui/view'
import { TouchableOpacity } from 'react-native'
import { Icon } from '@/components/ui/icon'
import { AlignJustify, Bell, Ellipsis, Home, LogOut, MessageCircle, Pencil, Plus, Search, Settings, User, Users, Video } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { TabsContent, TabsList, TabsTrigger, Tabs as TabsComponent } from '@/components/ui/tabs'


const TabLayout = () => {
  const colorScheme = useColorScheme()

  return (
    <Tabs screenOptions={{ 
      headerShown: true,
      
      tabBarActiveTintColor: colorScheme === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)',
      tabBarInactiveTintColor: colorScheme === 'dark' ? 'white' : 'black',
    }}
    >
        <Tabs.Screen name="feed" options={{ tabBarLabel: 'Feed', headerTitle: '', headerTransparent: true, headerLeft: () => (
          <TouchableOpacity style={{ padding: 10 }}>
            <Text>Home</Text>
          </TouchableOpacity>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={Home} size={size} color={color} />
        ), headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={{ padding: 10 }}>
            <Icon name={Plus} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }}>
            <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }}>
            <Icon name={MessageCircle} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
      )}} />
        <Tabs.Screen name="friends" options={{ tabBarLabel: 'Friends', headerTitle: '', headerTransparent: true, headerLeft: () => (
          <TouchableOpacity style={{ padding: 10 }}>
            <Text>Friends</Text>
          </TouchableOpacity>
        ), headerRight: () => (
          <TouchableOpacity style={{ padding: 10 }}>
            <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </TouchableOpacity>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={Users} size={size} color={color} />
        )}} />
        <Tabs.Screen name="reels" options={{ tabBarLabel: 'Reels', headerTitle: '', headerTransparent: true, headerLeft: () => (
          <TabsComponent defaultValue='tab1'>
            <TabsList style={{ backgroundColor: 'transparent' }}>
              <TabsTrigger value='tab1'>For You</TabsTrigger>
              <TabsTrigger value='tab2'>Explore</TabsTrigger>
            </TabsList>
          </TabsComponent>
        ), headerRight: () => (
          <>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={User} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
          </>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={Video} size={size} color={color} />
        )}} />
        <Tabs.Screen name="profile" options={{ tabBarLabel: 'Profile', headerTransparent: true, headerTitle: '', headerRight: () => (
          <>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Pencil} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
          </>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={User} size={size} color={color} />
        )}} />
        <Tabs.Screen name="notifications" options={{ tabBarLabel: 'Activity', headerTitle: '', headerTransparent: true, headerLeft: () => ( 
          <TouchableOpacity style={{ padding: 10 }}>
            <Text>Notifications</Text>
          </TouchableOpacity>
        ), headerRight: () => (
          <>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Ellipsis} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
          </>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={Bell} size={size} color={color} />
        )}} />
        <Tabs.Screen name="menu" options={{ tabBarLabel: 'Menu', headerTitle: '', headerTransparent: true, headerLeft: () => (
          <TouchableOpacity style={{ padding: 10 }}>
            <Text>Menu</Text>
          </TouchableOpacity>
        ), headerRight: () => (
          <>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Settings} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 10 }}>
              <Icon name={Search} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
          </>
        ), tabBarIcon: ({ color, size }) => (
          <Icon name={AlignJustify} size={size} color={color} />
        )}} />
    </Tabs>
  )
}

export default TabLayout