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
  const [story, setStory] = useState<Story | null>(null)

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
    </View>
  )
}
