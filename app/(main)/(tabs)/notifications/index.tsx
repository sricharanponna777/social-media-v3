import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, TouchableOpacity as Button, View } from 'react-native'
import { Text } from '@/components/ui/text'
import apiService from '@/lib/api'
import { Icon } from '@/components/ui/icon'
import { Bell, Check, Trash2 } from 'lucide-react-native'

type Notification = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

const NotificationsScreen = () => {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [unread, setUnread] = useState<number>(0)
  const [hasMore, setHasMore] = useState(true)
  const fetchingMoreRef = useRef(false)
  const limit = 20

  const load = useCallback(async (reset = false, pageOverride?: number) => {
    try {
      if (!reset) setLoading(true)
      const pageToLoad = reset ? 1 : (pageOverride ?? page)
      const res: any = await apiService.getNotifications(pageToLoad, limit)
      if (Array.isArray(res)) {
        // Backward compatibility: older backend returned array only
        setItems((prev) => (reset ? res : [...prev, ...res]))
        try {
          const unreadRes = await apiService.getUnreadNotificationsCount()
          setUnread(typeof unreadRes?.count === 'number' ? unreadRes.count : 0)
        } catch {
          setUnread(0)
        }
        setHasMore(res.length === limit)
      } else {
        const list: Notification[] = Array.isArray(res?.notifications) ? res.notifications : []
        const unreadCount: number = typeof res?.unreadCount === 'number' ? res.unreadCount : 0
        setItems((prev) => (reset ? list : [...prev, ...list]))
        setUnread(unreadCount)
        setHasMore(list.length === limit)
      }
      if (reset) setPage(1)
    } catch (e) {
      console.error('Failed to load notifications', e)
      if (reset) setItems([])
    } finally {
      if (!reset) setLoading(false)
      fetchingMoreRef.current = false
    }
  }, [page])

  useEffect(() => { load(true) }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load(true)
    setRefreshing(false)
  }, [load])

  const markRead = async (id: string) => {
    try {
      await apiService.markNotificationsRead([id])
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnread((c) => Math.max(0, c - 1))
    } catch (e) {
      console.error('Mark read failed', e)
    }
  }

  const deleteOne = async (id: string) => {
    try {
      await apiService.deleteNotifications([id])
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      console.error('Delete notification failed', e)
    }
  }

  const header = useMemo(() => (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Bell} size={18} />
          <Text className="text-lg font-semibold">Notifications</Text>
        </View>
        <Text className="text-foreground/70">Unread: {unread}</Text>
      </View>
    </View>
  ), [unread])

  const renderItem = ({ item }: { item: Notification }) => (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-muted/40">
      <View className="flex-1 pr-3">
        <Text className={`text-[13px] ${item.is_read ? 'text-foreground/70' : 'text-foreground'}`}>{item.message}</Text>
        <Text className="text-[11px] text-foreground/50 mt-1">{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {!item.is_read && (
          <Button onPress={() => markRead(item.id)} className="px-3 py-1 bg-green-500 rounded-full">
            <Icon as={Check} size={16} color={'white'} />
          </Button>
        )}
        <Button onPress={() => deleteOne(item.id)} className="px-3 py-1 bg-red-500 rounded-full">
          <Icon as={Trash2} size={16} color={'white'} />
        </Button>
      </View>
    </View>
  )

  const onEndReached = async () => {
    if (loading || fetchingMoreRef.current || !hasMore) return
    fetchingMoreRef.current = true
    const next = page + 1
    setPage(next)
    await load(false, next)
  }

  return (
    <View className="flex-row items-start justify-start flex-1">
      {loading && items.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={items.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : undefined}
          ListEmptyComponent={<Text className="self-center text-foreground/60">No notifications</Text>}
        />
      )}
    </View>
  )
}

export default NotificationsScreen
