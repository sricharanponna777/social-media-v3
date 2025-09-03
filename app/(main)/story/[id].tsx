import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Icon } from '@/components/ui/icon'
import { ArrowLeft, Heart } from 'lucide-react-native'

import apiService from '@/lib/api'
import { API_URL } from '@/constants'
import { Image } from 'expo-image'
import { useAuth } from '@/contexts/AuthContext'


interface Story {
  id: string
  media_url: string
  media_type: string
  caption?: string
  duration: number
}

export default function StoryView() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const userId = (user as any)?.id as string | undefined
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showReactions, setShowReactions] = useState(false)
  type reactions = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  const reactionMap: Record<reactions, string> = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡'
  }
  const [selectedType, setSelectedType] = useState<reactions>('like')
  const [ownType, setOwnType] = useState<reactions | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const progress = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const isPaused = useRef(false)

  // Load story
  useEffect(() => {
    const loadStories = async () => {
      try {
        const data: Story[] = await apiService.getFeedStories()
        setStories(data)
        const index = data.findIndex((s) => s.id === id)
        setCurrentIndex(index !== -1 ? index : 0)
      } catch (error) {
        console.error('Failed to load stories:', error)
      }
    }
    loadStories()
  }, [id])

  useEffect(() => {
    if (story) {
      apiService
        .viewStory(story.id, { completed: true })
        .catch((err) => console.error('Failed to record story view:', err))
    }
  }, [story])

  // const handleNext = () => {
  //   if (currentIndex < stories.length - 1) {
  //     setCurrentIndex((prev) => prev + 1)
  //   } else {
  //     router.back()
  //   }
  // }

  // const handlePrevious = () => {
  //   if (currentIndex > 0) {
  //     setCurrentIndex((prev) => prev - 1)
  //   } else {
  //     router.back()
  //   }
  // }

  // Animate progress
  
  const story = stories[currentIndex]

  const ensureCounts = useCallback(async () => {
    if (!story) return
    try {
      const res = await apiService.getReactions('story', story.id)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCounts(map)
      try {
        const reactionsArr = (res as any)?.reactions as any[] | undefined
        const mine = reactionsArr?.find((r) => r?.user_id === userId)
        if (mine?.reaction_name) {
          setOwnType(mine.reaction_name)
          setSelectedType(mine.reaction_name)
        } else {
          setOwnType(null)
        }
      } catch {}
    } catch {}
  }, [story, userId])

  useEffect(() => {
    ensureCounts()
  }, [ensureCounts])

  const chooseReaction = useCallback(async (type: reactions) => {
    if (!story) return
    try {
      await apiService.reactToStory(story.id, type)
      setSelectedType(type)
      setOwnType(type)
      const res = await apiService.getReactions('story', story.id)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCounts(map)
    } catch {}
    finally {
      setShowReactions(false)
    }
  }, [story])

  const quickToggle = useCallback(async () => {
    if (!story) return
    try {
      await ensureCounts()
      if (!ownType) {
        await chooseReaction('like')
      } else if (ownType === 'like') {
        await apiService.removeReaction('story', story.id)
        setOwnType(null)
        const res = await apiService.getReactions('story', story.id)
        const map: Record<string, number> = {}
        if (Array.isArray((res as any)?.counts)) {
          for (const it of (res as any).counts as any[]) {
            if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
          }
        }
        setCounts(map)
      } else {
        await chooseReaction('like')
      }
    } catch {}
  }, [ensureCounts, ownType, chooseReaction, story])
  
  useEffect(() => {
    const startProgress = (duration: number) => {
    progress.setValue(0)
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    })
    animationRef.current.start(({ finished }) => {
      if (finished) router.back()
    })
  }
    if (story) startProgress(story.duration)
  }, [story, router, progress])

  const pauseProgress = () => {
    if (!isPaused.current && animationRef.current) {
      animationRef.current.stop()
      isPaused.current = true
    }
  }


  const resumeProgress = () => {
    if (isPaused.current && story) {
      const remaining = (1 - (progress as any)._value) * story.duration * 1000
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: remaining,
        easing: Easing.linear,
        useNativeDriver: false,
      })
      animationRef.current.start(({ finished }) => {
        if (finished) router.back()
      })
      isPaused.current = false
    }
  }

  if (!story) {
    return (
      <View className="items-center justify-center flex-1">
        <Text>Loading...</Text>
      </View>
    )
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View className="flex-1 bg-black">
      {/* Progress Bar */}
      <View className="absolute top-0 left-0 right-0 z-10 h-1 bg-gray-700">
        <Animated.View
          style={{ width: progressWidth }}
          className="h-full bg-white"
        />
      </View>

      {/* Back Button */}
      <TouchableOpacity
        className="absolute z-10 top-10 left-10"
        onPress={() => router.back()}
      >
        <Icon as={ArrowLeft} size={24} color="white" />
      </TouchableOpacity>

      {/* Media with press/hold */}
      <Pressable
        className="flex-1"
        onPressIn={pauseProgress}
        onPressOut={resumeProgress}
      >
        {story.media_type === 'video' ? (
          <View className="items-center justify-center w-full h-full">
            <Text className="text-white">Video not supported</Text>
          </View>
        ) : (
          <View className="w-full h-full">
            <Image
              source={{ uri: `${API_URL}${story.media_url}` }}
              style={{ flex: 1 }}
              contentFit="contain"
            />
          </View>
        )}
      </Pressable>

      {/* Caption */}
      {story.caption ? (
        <View className="absolute left-0 right-0 px-4 bottom-10">
          <Text className="text-lg text-white">{story.caption}</Text>
        </View>
      ) : null}


      {/* Reaction Action */}
      <View className="absolute items-center bottom-10 right-6">
        <TouchableOpacity onPress={quickToggle} onLongPress={() => setShowReactions((v) => !v)}>
          {ownType ? (
            <Text className="text-2xl">{reactionMap[ownType]}</Text>
          ) : (
            <Icon as={Heart} size={26} color={'white'} />
          )}
        </TouchableOpacity>
        <Text className="mt-1 text-xs text-white/90">{Object.values(counts).reduce((a, b) => a + b, 0)}</Text>
      </View>

      {/* Reactions popover */}
      {showReactions && (
        <View className="absolute flex-row items-center gap-3 px-3 py-2 rounded-full bg-black/40 bottom-24 right-6">
          <TouchableOpacity onPress={() => chooseReaction('like')}><Text className="text-xl text-white">👍</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => chooseReaction('love')}><Text className="text-xl text-white">❤️</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => chooseReaction('haha')}><Text className="text-xl text-white">😂</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => chooseReaction('wow')}><Text className="text-xl text-white">😮</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => chooseReaction('sad')}><Text className="text-xl text-white">😢</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => chooseReaction('angry')}><Text className="text-xl text-white">😡</Text></TouchableOpacity>
        </View>
      )}

      {/* No comments for stories */}
    </View>
  )
}
