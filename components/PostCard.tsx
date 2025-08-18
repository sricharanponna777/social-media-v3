import React from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import { API_URL } from '@/constants'
import { MessageCircle, Share, ThumbsUp, Flag } from 'lucide-react-native'
import { VideoView } from 'expo-video'

export interface Post {
  id: string
  content: string
  media_urls: string[]
  user_id: string
  username: string
  avatar_url: string
  full_name: string
}

interface PostCardProps {
  post: Post
}

function getMediaType(fileNameOrMime: string): 'video' | 'image' | 'unknown' {
  const input = fileNameOrMime.toLowerCase().trim()
  if (input.startsWith('image/')) return 'image'
  if (input.startsWith('video/')) return 'video'
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg']
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
  const extMatch = input.match(/\.([a-z0-9]+)$/)
  if (extMatch) {
    const ext = extMatch[1]
    if (imageExts.includes(ext)) return 'image'
    if (videoExts.includes(ext)) return 'video'
  }
  return 'unknown'
}

const { width } = Dimensions.get('window')

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <View style={{ marginVertical: 10, borderWidth: 1, borderRadius: 8, overflow: 'hidden' }}>
      <View style={{ padding: 10 }}>
        <Text>Posted By {post.full_name}</Text>
      </View>
      {post.media_urls.length > 0 && (
        <ScrollView horizontal pagingEnabled style={{ width: '100%', height: 240 }}>
          {post.media_urls.map((uri, index) => (
            <View key={index} style={{ width }}>
              {getMediaType(uri) === 'image' ? (
                <Image
                  source={{ uri: `${API_URL}${uri}` }}
                  style={{ width, height: 240 }}
                  resizeMode="cover"
                />
              ) : (
                <VideoView
                  source={{ uri: `${API_URL}${uri}` }}
                  style={{ width, height: 240 }}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
      <View style={{ padding: 10 }}>
        <Text>{post.content}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
        <TouchableOpacity>
          <ThumbsUp size={24} />
        </TouchableOpacity>
        <TouchableOpacity>
          <MessageCircle size={24} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Share size={24} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Flag size={24} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default PostCard
