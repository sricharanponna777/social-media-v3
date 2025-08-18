import React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Text } from '@/components/ui/text'
import { View } from '@/components/ui/view'
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
      <Avatar size={60} style={{ borderWidth: 2, borderColor: 'pink' }}>
        <AvatarImage source={{ uri: `${API_URL}${item.avatar_url}` }} />
      </Avatar>
      <Text variant="caption" style={{ marginTop: 4 }}>
        {item.username}
      </Text>
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
