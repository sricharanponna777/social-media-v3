import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity as Button, ActivityIndicator } from 'react-native'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { Text } from '@/components/ui/text'
import apiService from '@/lib/api'
import { useFocusEffect } from '@react-navigation/native'
import ReelItem from '@/components/ReelItem'
import { useRouter } from 'expo-router'

export type Reel = {
  id: string
  media_url: string
  thumbnail_url?: string | null
  caption?: string | null
  duration?: number | null
  likes_count?: number
  comments_count?: number
  user_id?: string
  created_at?: string
}

const ReelsScreen = () => {
  const [tab, setTab] = useState<'fyp' | 'trending'>('fyp')
  const [reels, setReels] = useState<Reel[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const frame = useSafeAreaFrame() // safe-area aware width/height
  const tabBarH = useBottomTabBarHeight()
  const availableHeight = useMemo(() => Math.max(0, frame.height - tabBarH), [frame.height, tabBarH])
  const availableWidth = frame.width

  const viewStartRef = useRef<number | null>(null)
  const listRef = useRef<FlatList<Reel>>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      let items: Reel[] = []
      if (tab === 'fyp') {
        const data: any = await apiService.getPersonalizedReels(1, 20)
        items = Array.isArray(data) ? data : (Array.isArray(data?.reels) ? data.reels : [])
      } else {
        const data: Reel[] = await apiService.getTrendingReels(1, 20)
        items = Array.isArray(data) ? data : []
      }
      setReels(items)
      setIndex(0)
      // ensure list jumps to top when tab changes / reloads, but only if data exists
      if (items.length > 0) {
        requestAnimationFrame(() => listRef.current?.scrollToIndex({ index: 0, animated: false }))
      }
    } catch (e) {
      console.error('Failed to load reels', e)
      setReels([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const Empty = useCallback(() => (
    <View className="flex-1 items-center justify-center p-6">
      <View className="absolute flex-row gap-3 top-14 left-4">
        <Button onPress={() => setTab('fyp')} className={`rounded-full px-3 py-1 ${tab === 'fyp' ? 'bg-white/80' : 'bg-black/40'}`}>
          <Text className={tab === 'fyp' ? 'text-black' : 'text-white'}>For You</Text>
        </Button>
        <Button onPress={() => setTab('trending')} className={`rounded-full px-3 py-1 ${tab === 'trending' ? 'bg-white/80' : 'bg-black/40'}`}>
          <Text className={tab === 'trending' ? 'text-black' : 'text-white'}>Trending</Text>
        </Button>
      </View>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Text className="text-white/90 mb-3">No reels to show</Text>
          <View className="flex-row gap-3">
            <Button className="rounded-md bg-white/80 px-3 py-2" onPress={load}>
              <Text className="text-black">Refresh</Text>
            </Button>
            {tab === 'fyp' ? (
              <Button className="rounded-md bg-white/30 px-3 py-2" onPress={() => setTab('trending')}>
                <Text className="text-white">Try Trending</Text>
              </Button>
            ) : (
              <Button className="rounded-md bg-white/30 px-3 py-2" onPress={() => router.push('/(main)/(create)/reel')}>
                <Text className="text-white">Create Reel</Text>
              </Button>
            )}
          </View>
        </>
      )}
    </View>
  ), [tab, loading, load, router])

  // Track view duration per reel
  useEffect(() => {
    const reel = reels[index]
    if (!reel) return
    viewStartRef.current = Date.now()
    return () => {
      const start = viewStartRef.current
      if (start && reel.id) {
        const duration = Math.floor((Date.now() - start) / 1000)
        if (duration > 0) {
          apiService.trackReelView(reel.id, duration).catch(() => {})
        }
      }
      viewStartRef.current = null
    }
  }, [index, reels])

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems?.length) return
    // Pick the highest-coverage visible item
    const best = [...viewableItems]
      .filter((v) => v?.isViewable && typeof v?.index === 'number')
      .sort((a, b) => (b?.percentVisible ?? 0) - (a?.percentVisible ?? 0))[0]
    if (best && typeof best.index === 'number') setIndex(best.index)
  }).current

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current

  const renderItem = useCallback(
    ({ item, index: i }: { item: Reel; index: number }) => {
      const active = i === index
      // Card dimensions: centered, with breathing room and 9:16 aspect
      const cardHeight = Math.round(availableHeight * 0.9)
      const cardWidthByHeight = Math.round(cardHeight * 9 / 16)
      const maxWidth = Math.round(availableWidth * 0.92)
      const cardWidth = Math.min(cardWidthByHeight, maxWidth)

      return (
        <View style={{ height: availableHeight, width: availableWidth }}>
          <View className="items-center justify-center" style={{ height: availableHeight }}>
            <ReelItem item={item} active={active} height={cardHeight} width={cardWidth} />
          </View>
          <View className="absolute flex-row gap-3 top-14 left-4">
            <Button
              onPress={() => setTab('fyp')}
              className={`rounded-full px-3 py-1 ${tab === 'fyp' ? 'bg-white/80' : 'bg-black/40'}`}
            >
              <Text className={tab === 'fyp' ? 'text-black' : 'text-white'}>For You</Text>
            </Button>
            <Button
              onPress={() => setTab('trending')}
              className={`rounded-full px-3 py-1 ${tab === 'trending' ? 'bg-white/80' : 'bg-black/40'}`}
            >
              <Text className={tab === 'trending' ? 'text-black' : 'text-white'}>Trending</Text>
            </Button>
          </View>
        </View>
      )
    },
    [index, tab, availableHeight, availableWidth]
  )

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['left', 'right']}> 
      {/* leave top edge off for full-bleed under status bar; add 'top' if you want below status bar */}
      <FlatList
          ref={listRef}
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={Empty}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          decelerationRate="fast"
          snapToInterval={availableHeight}
          snapToAlignment="start"
          getItemLayout={(_, i) => ({ length: availableHeight, offset: availableHeight * i, index: i })}
          // re-render/snap recalculation when dimensions change (rotation, insets change)
          extraData={availableHeight}
          contentContainerStyle={reels.length === 0 ? { flexGrow: 1 } : undefined}
      />
    </SafeAreaView>
  )
}

export default ReelsScreen
