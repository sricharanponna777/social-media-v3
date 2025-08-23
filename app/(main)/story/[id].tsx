import React, { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { View } from '@/components/ui/view'
import { Text } from '@/components/ui/text'
import { Image } from '@/components/ui/image'
import { Video } from '@/components/ui/video'
import { Icon } from '@/components/ui/icon'
import { ArrowLeft } from 'lucide-react-native'
import apiService from '@/lib/api'
import { API_URL } from '@/constants'

interface Story {
  id: string
  media_url: string
  media_type: string
  caption?: string
}

export default function StoryView() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

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

  if (!story) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <TouchableOpacity
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}
        onPress={() => router.back()}
      >
        <Icon name={ArrowLeft} size={24} color="white" />
      </TouchableOpacity>
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
      {story.caption ? (
        <View className="absolute bottom-10 left-0 right-0 px-4">
          <Text className="text-white">{story.caption}</Text>
        </View>
      ) : null}
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handlePrevious}
        />
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleNext}
        />
      </View>
    </View>
  )
}
