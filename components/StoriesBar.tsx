import React from 'react'
import { FlatList, TouchableOpacity, View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { API_URL } from '@/constants'

export interface StoryItem {
  id: string
  username: string
  avatar_url: string
}

interface StoriesBarProps {
  stories: StoryItem[]
}

const StoriesBar: React.FC<StoriesBarProps> = ({ stories }) => {
  const router = useRouter()

  const renderItem = ({ item }: { item: StoryItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/story/${item.id}`)}
      style={{ alignItems: 'center', marginRight: 12 }}
    >
      <Image
        source={{ uri: `${API_URL}${item.avatar_url}` }}
        style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'pink' }}
      />
      <Text style={{ marginTop: 4, fontSize: 12 }}>{item.username}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={{ paddingVertical: 10 }}>
      <FlatList
        horizontal
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

export default StoriesBar
