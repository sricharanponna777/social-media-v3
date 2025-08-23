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
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

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

  const story = stories[currentIndex]

  useEffect(() => {
    if (story) {
      apiService
        .viewStory(story.id, { completed: true })
        .catch((err) => console.error('Failed to record story view:', err))
    }
  }, [story])

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      router.back()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      router.back()
    }
  }

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
        className='absolute z-10 top-10 left-10'
        onPress={() => router.back()}
      >
        <Icon name={ArrowLeft} size={24} color="white" />
      </TouchableOpacity>

      {/* Media with press/hold */}
      <Pressable
        style={{ flex: 1 }}
        onPressIn={pauseProgress}
        onPressOut={resumeProgress}>
        {story.media_type === 'video' ? (
          <Video
            source={{ uri: `${API_URL}${story.media_url}` }}
            className='w-full h-full'
            autoPlay
          />
        ) : (
          <Image
            source={{ uri: `${API_URL}${story.media_url}` }}
            className='w-full h-full'
            contentFit="contain"
          />
        )}
      </Pressable>

      {/* Caption */}
      {story.caption ? (
        <View className="absolute left-0 right-0 px-4 bottom-10">
          <Text className="text-lg text-white">{story.caption}</Text>
        </View>
      ) : null}
    </View>
  )
}
