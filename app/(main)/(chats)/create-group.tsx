import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, FlatList, TouchableOpacity as Button } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/ui/text'
import { Input as TextInput } from '@/components/ui/input'
import { Icon } from '@/components/ui/icon'
import { CheckSquare, Square, ArrowLeft } from 'lucide-react-native'
import apiService from '@/lib/api'

type User = { id: string; username: string; avatar_url?: string | null }

export default function CreateGroup() {
  const router = useRouter()
  const [friends, setFriends] = useState<User[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [title, setTitle] = useState('')

  const loadFriends = useCallback(async () => {
    try {
      const data: User[] = await apiService.getFriends()
      setFriends(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load friends', e)
      setFriends([])
    }
  }, [])

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])

  const create = useCallback(async () => {
    if (!title.trim() || selectedIds.length === 0) return
    try {
      const conv = await apiService.createConversation({ title: title.trim(), participants: selectedIds, type: 'group' })
      router.replace({ pathname: '/(main)/(chats)/[id]', params: { id: conv.id } })
    } catch (e) {
      console.error('Failed to create group', e)
    }
  }, [router, selectedIds, title])

  const renderItem = useCallback(({ item }: { item: User }) => {
    const isSel = !!selected[item.friend_id]
    return (
      <Button onPress={() => toggle(item.friend_id)} className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-foreground">{item.username}</Text>
        <Icon as={isSel ? CheckSquare : Square} size={22} />
      </Button>
    )
  }, [selected, toggle])

  return (
    <View className="flex-1 pt-20">
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Button onPress={() => router.back()} className="p-2 mr-2">
          <Icon as={ArrowLeft} size={22} />
        </Button>
        <Text className="text-xl font-semibold text-foreground">New Group</Text>
        <View style={{ width: 44 }} />
      </View>
      <View className="px-4 pb-3">
        <TextInput placeholder="Group title" value={title} onChangeText={setTitle} />
        <Text className="mt-2 opacity-70 text-foreground">{selectedIds.length} selected</Text>
      </View>
      <FlatList data={friends} keyExtractor={(i) => i.id} renderItem={renderItem} />
      <Button onPress={create} disabled={!title.trim() || selectedIds.length === 0} className={`m-4 h-12 rounded-full items-center justify-center ${title.trim() && selectedIds.length ? 'bg-green-500' : 'bg-gray-400'}`}>
        <Text className="text-white">Create Group</Text>
      </Button>
    </View>
  )
}

