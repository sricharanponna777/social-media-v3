import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Image, RefreshControl, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useAuth } from '@/contexts/AuthContext'
import apiService from '@/lib/api'
import PostCard from '@/components/PostCard'

type Profile = {
  id: string
  username: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  cover_photo_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
}

type Post = {
  id: string
  content: string
  media_urls: string[]
  user_id: string
  likes_count?: number
  comments_count?: number
}

const ProfileScreen = () => {
  const { user } = useAuth()
  const userId = user?.id as string | undefined
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const fetchingMoreRef = useRef(false)
  const limit = 10

  const load = useCallback(async (reset = false, pageOverride?: number) => {
    if (!userId) return
    try {
      if (!reset) setLoading(true)
      const pageToLoad = reset ? 1 : (pageOverride ?? page)
      const [p, ps] = await Promise.all([
        apiService.getProfile(userId),
        apiService.getUserPosts(userId, pageToLoad, limit),
      ])
      setProfile(p)
      setPosts((prev) => (reset ? ps : [...prev, ...ps]))
      setHasMore(Array.isArray(ps) ? ps.length === limit : false)
      if (reset) setPage(1)
    } catch (e) {
      console.error('Failed to load profile', e)
      if (reset) setPosts([])
    } finally {
      if (!reset) setLoading(false)
      fetchingMoreRef.current = false
    }
  }, [userId, page])

  useEffect(() => {
    if (userId) load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load(true)
    setRefreshing(false)
  }, [load])

  const header = useMemo(() => (
    <View>
      {profile?.cover_photo_url ? (
        <Image source={{ uri: profile.cover_photo_url }} style={{ width: '100%', height: 140 }} />
      ) : (
        <View style={{ height: 140 }} className="bg-muted" />
      )}
      <View className="px-4 -mt-10">
        <View className="flex-row items-end">
          <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-background bg-muted" />
          <View className="ml-3">
            <Text className="text-xl font-bold">{profile?.full_name || profile?.username || 'Profile'}</Text>
            {profile?.username ? (
              <Text className="text-foreground/60">@{profile.username}</Text>
            ) : null}
          </View>
        </View>
        {profile?.bio ? (
          <Text className="mt-3 text-foreground/90">{profile.bio}</Text>
        ) : null}
        {profile?.location ? (
          <Text className="mt-1 text-foreground/70">{profile.location}</Text>
        ) : null}
        {profile?.website ? (
          <Text className="mt-1 text-primary">{profile.website}</Text>
        ) : null}
        <Text className="mt-6 mb-2 text-lg font-semibold">Posts</Text>
      </View>
    </View>
  ), [profile])

  const renderItem = ({ item }: { item: Post }) => (
    <PostCard
      post={{
        ...item,
        username: profile?.username || '',
        full_name: profile?.full_name || '',
        avatar_url: profile?.avatar_url || '',
      } as any}
    />
  )

  const onEndReached = async () => {
    if (loading || !userId || fetchingMoreRef.current || !hasMore) return
    fetchingMoreRef.current = true
    const next = page + 1
    setPage(next)
    await load(false, next)
  }

  return (
    <View className="flex-1">
      {loading && posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
        />
      )}
    </View>
  )
}

export default ProfileScreen
