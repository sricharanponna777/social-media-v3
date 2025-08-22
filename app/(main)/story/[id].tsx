import React, { useEffect, useState, useRef } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Video } from '@/components/ui/video'
import { Icon } from '@/components/ui/icon'
import { ArrowLeft } from 'lucide-react-native'
import apiService from '@/lib/api'
import { API_URL } from '@/constants'
import { Image } from 'expo-image'

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
  const [story, setStory] = useState<Story | null>(null)

  const progress = useRef(new Animated.Value(0)).current
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const isPaused = useRef(false)

  // Load story
  useEffect(() => {
    const loadStory = async () => {
      try {
        const data: Story = await apiService.getStory(id as string)
        setStory(data)
        await apiService.viewStory(id as string, { completed: true })
      } catch (error) {
        console.error('Failed to load story:', error)
      }
    }
    loadStory()
  }, [id])

  // Animate progress
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

  useEffect(() => {
    if (story) startProgress(story.duration)
  }, [story])

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
          style={{
            height: '100%',
            backgroundColor: 'white',
            width: progressWidth,
          }}
        />
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}
        onPress={() => router.back()}
      >
        <Icon name={ArrowLeft} size={24} color="white" />
      </TouchableOpacity>

      {/* Media with press/hold */}
      <Pressable
        style={{ flex: 1 }}
        onPressIn={pauseProgress}
        onPressOut={resumeProgress}
      >
        {story.media_type === 'video' ? (
          <Video
            source={{ uri: `${API_URL}${story.media_url}` }}
            style={{ width: '100%', height: '100%' }}
            autoPlay
          />
        ) : (
          <Image
            source={{ uri: `${API_URL}${story.media_url}` }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        )}
      </Pressable>

      {/* Caption */}
      {story.caption && (
        <View className="absolute left-0 right-0 px-4 bottom-10">
          <Text className="text-lg text-white">{story.caption}</Text>
        </View>
      )}
    </View>
  )
}
