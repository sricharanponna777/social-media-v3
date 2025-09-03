import React, { useCallback, useState } from 'react'
import { View, TouchableOpacity as Button, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { MessageCircle, Plus } from 'lucide-react-native'
import apiService from '@/lib/api'

type Conversation = {
  id: string
  title?: string | null
  type: 'private' | 'group'
  created_at?: string
  updated_at?: string
}

export default function Chats() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [navigating, setNavigating] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const data: Conversation[] = await apiService.getConversations(1, 50)
      setConversations(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load conversations', e)
      setConversations([])
    }
  }, [])

  const loadUnread = useCallback(async () => {
    try {
      const items: { conversation_id: string; unread_count: string | number }[] = await apiService.getUnreadCounts()
      const map: Record<string, number> = {}
      items.forEach((it) => {
        const n = typeof it.unread_count === 'string' ? parseInt(it.unread_count, 10) : (it.unread_count as number)
        map[it.conversation_id] = Number.isFinite(n) ? n : 0
      })
      setUnread(map)
    } catch (e) {
      console.error('Failed to load unread counts', e)
      setUnread({})
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadConversations()
      loadUnread()
    }, [loadConversations, loadUnread])
  )

  const renderItem = useCallback(({ item }: { item: Conversation }) => {
    const count = unread[item.id] || 0
    return (
      <Button
        onPress={() => {
          setNavigating(true)
          router.push({ pathname: '/(main)/(chats)/[id]', params: { id: item.id } })
        }}
        className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800"
      >
        <View className="flex-row items-center gap-3">
          <Icon as={MessageCircle} size={20} />
          <Text className="text-foreground">{(item.other_username) || (item.type === 'group' ? 'Group' : 'Chat')}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {count > 0 && (
            <View className="items-center justify-center w-6 h-6 bg-green-500 rounded-full">
              <Text className="text-xs text-white">{count}</Text>
            </View>
          )}
          <Text className="text-xs opacity-60 text-foreground">{item.type}</Text>
        </View>
      </Button>
    )
  }, [router, unread])

  return (
    <View className="flex-1 pt-20">
      <View className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">My Chats</Text>
        <Button
          onPress={() => {
            setNavigating(true)
            router.push('/(main)/(chats)/create-group')
          }}
          disabled={navigating}
          className="p-2"
        >
          <Icon as={Plus} size={22} />
        </Button>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text className="px-4 py-8 text-center opacity-60 text-foreground">No conversations yet</Text>}
      />
    </View>
  )
}
