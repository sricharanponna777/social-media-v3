import React, { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, Switch, TouchableOpacity, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import apiService from '@/lib/api'
import { Image } from 'expo-image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Bell, Camera, ChevronRight, FileText, HelpCircle, Info, LogOut, Settings, Users, Video, MessageCircle, Heart } from 'lucide-react-native'

type Prefs = Record<string, any>

const MenuScreen = () => {
  const router = useRouter()
  const { removeToken } = useAuth()
  const [prefs, setPrefs] = useState<Prefs>({})
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)

  const togglePref = async (key: string) => {
    try {
      const next = { ...prefs, [key]: !prefs[key] }
      setPrefs(next)
      await apiService.updateNotificationPreferences(next)
    } catch (e) {
      console.error('Failed to update preference', e)
      Alert.alert('Error', 'Failed to update preference')
    }
  }

  const initials = useMemo(() => {
    const fn = profile?.full_name || ''
    if (!fn) return (profile?.username || 'U').slice(0, 1).toUpperCase()
    const parts = fn.split(' ').filter(Boolean)
    return (parts[0]?.[0] || 'U').toUpperCase()
  }, [profile])

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
      {/* Profile header */}
      <Card className="p-0 mb-4 overflow-hidden">
        {profile?.cover_photo_url ? (
          <Image source={{ uri: profile.cover_photo_url }} className="w-full h-28" contentFit="cover" />
        ) : (
          <View className="h-28 bg-muted" />
        )}
        <CardContent className="-mt-10">
          <View className="flex-row items-end">
            {/* Avatar */}
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-20 h-20 border-2 rounded-full border-background" />
            ) : (
              <View className="items-center justify-center w-20 h-20 border-2 rounded-full bg-white/20 border-background">
                <Text className="text-xl font-bold">{initials}</Text>
              </View>
            )}
            <View className="ml-3">
              <Text className="text-xl font-semibold">{profile?.full_name || profile?.username || 'Your Profile'}</Text>
              {profile?.username ? (<Text className="text-foreground/60">@{profile.username}</Text>) : null}
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Quick create actions */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-3">
            <TouchableOpacity className="items-center justify-center flex-1 py-4 rounded-xl bg-primary/10" onPress={() => router.push('/(main)/(create)/post')}>
              <Icon as={FileText} size={18} />
              <Text className="mt-1 text-sm">Create Post</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center flex-1 py-4 rounded-xl bg-primary/10" onPress={() => router.push('/(main)/(create)/story')}>
              <Icon as={Camera} size={18} />
              <Text className="mt-1 text-sm">Create Story</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center justify-center flex-1 py-4 rounded-xl bg-primary/10" onPress={() => router.push('/(main)/(create)/reel')}>
              <Icon as={Video} size={18} />
              <Text className="mt-1 text-sm">Create Reel</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
      {/* More */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>More</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkRow title="Friends" icon={Users} onPress={() => router.push('/(main)/(tabs)/friends')} />
          <LinkRow title="Settings" icon={Settings} onPress={() => Alert.alert('Coming soon', 'Settings will be available later')} />
          <LinkRow title="Help & Support" icon={HelpCircle} onPress={() => Alert.alert('Help', 'Contact support@example.com')} />
          <LinkRow title="About" icon={Info} onPress={() => Alert.alert('About', 'Social Media v3')} />
        </CardContent>
      </Card>

      <Button className="h-12 bg-red-500" onPress={async () => { await removeToken(); router.replace('/') }}>
        <View className="flex-row items-center justify-center gap-2">
          <Icon as={LogOut} size={18} color={'white'} />
          <Text className="text-white">Log out</Text>
        </View>
      </Button>
    </ScrollView>
  )
}

export default MenuScreen

// Simple row component with leading icon and optional trailing control
function Row({ title, icon: IconComp, trailing, onPress }: { title: string; icon: any; trailing?: React.ReactNode; onPress?: () => void }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-muted/30">
      <View className="flex-row items-center gap-3">
        <Icon as={IconComp} size={18} />
        <Text>{title}</Text>
      </View>
      {trailing}
    </View>
  )
}

function LinkRow({ title, icon: IconComp, onPress }: { title: string; icon: any; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center justify-between py-3 border-b border-muted/30">
      <View className="flex-row items-center gap-3">
        <Icon as={IconComp} size={18} />
        <Text>{title}</Text>
      </View>
      <Icon as={ChevronRight} size={18} />
    </TouchableOpacity>
  )
}

// (no-op)
