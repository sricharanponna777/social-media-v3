
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Text } from './ui/text';
import { Icon } from './ui/icon';
import { Angry, Flag, Heart, Laugh, LucideIcon, MessageCircle, Share, ThumbsUp } from 'lucide-react-native';
import { TouchableOpacity, useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import { API_URL } from '@/constants';
import { BORDER_RADIUS } from '@/theme/globals';
import _ from 'lodash';
import Carousel from './ui/carousel';
import { BlurView } from 'expo-blur';
import apiService from '@/lib/api';
import PostComments from './PostComments';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
export interface Post {
  id: string;
  content: string;
  media_urls: string[];
  user_id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  likes_count?: number;
  comments_count?: number;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  type reactions = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  const reactionMap: Record<reactions, string> = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
  }
  const { user } = useAuth()
  const userId = (user as any)?.id as string | undefined
  const [sharing, setSharing] = useState<boolean>(false)
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [selectedType, setSelectedType] = useState<reactions>('like')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [ownType, setOwnType] = useState<reactions | null>(null)
  
  const handleShare = async () => {
    setSharing(true)
  };
  const images = _.map(post.media_urls, (str) => ({ uri: str, caption: post.content }))
  const ensureCounts = useCallback(async () => {
    if (Object.keys(counts).length) return
    try {
      const res = await apiService.getReactions('post', post.id)
      const map: Record<string, number> = {}
      if (Array.isArray((res as any)?.counts)) {
        for (const it of (res as any).counts as any[]) {
          if (typeof it?.name === 'string') map[it.name] = parseInt(String(it.count || 0), 10)
        }
      }
      setCounts(map)
      // detect own reaction to select the appropriate tab and for "others" math
      try {
        const reactionsArr = (res as any)?.reactions as any[] | undefined
        const mine = reactionsArr?.find((r) => r?.user_id === userId)
        if (mine?.reaction_name) {
          setOwnType(mine.reaction_name)
          setSelectedType(mine.reaction_name)
        }
      } catch {}
    } catch {}
  }, [counts, post.id])

  // Hydrate reaction data on initial render
  useEffect(() => {
    ensureCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id])

  const countForSelected = useMemo(() => {
    const total = counts[selectedType] ?? 0
    const others = ownType === selectedType ? Math.max(0, total - 1) : total
    return others
  }, [counts, selectedType, ownType])

  const chooseReaction = async (type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') => {
    try {
      const reactionRes = await apiService.reactToPost(post.id, type)
      console.log(reactionRes)
      setSelectedType(type)
      setOwnType(type)
      const res = await apiService.getReactions('post', post.id)
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
  }

  const handleQuickReact = async () => {
    try {
      // Mimic FB: tap toggles Like. If you had another reaction, tap switches to Like. If you had Like, tap removes reaction.
      if (!ownType) {
        await chooseReaction('like')
      } else if (ownType === 'like') {
        await apiService.removeReaction('post', post.id)
        setOwnType(null)
        // refresh counts
        const res = await apiService.getReactions('post', post.id)
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
  }

  return (
      <Card className="my-2.5">
        <CardHeader>
          <View className="flex-row items-center">
            <Text className="ml-2.5">Posted By {post.full_name}</Text>
          </View>
        </CardHeader>
        <CardContent>
          <Carousel
            data={images}
            renderItem={({ item }) => (
              <Image
                source={{ uri: `${API_URL}${item.uri}` }}
                style={{
                  width: '87%',
                  height: 240,
                  borderRadius: BORDER_RADIUS,
                }}
                contentFit='cover'
              />
            )}
          />
          <Text className="mt-2.5">
            {post.content}
          </Text>
        </CardContent>
        <CardFooter>
          <View className="flex-row items-center gap-8 pr-5">
            <View className="items-center">
              <TouchableOpacity
                onPress={handleQuickReact}
                onLongPress={async () => { await ensureCounts(); setShowReactions(true) }}
              >
                {ownType && <Text>{reactionMap[ownType]}</Text>}
                {!ownType && <Icon as={ThumbsUp} size={24} />} 
              </TouchableOpacity>
              <Text className="mt-1 text-xs">{Object.keys(counts).length ? Object.values(counts).reduce((a, b) => a + b, 0) : (post.likes_count || 0)}</Text>
            </View>
            <View className="items-center">
              <TouchableOpacity onPress={() => setShowComments(true)}>
                <Icon as={MessageCircle} size={24} />
              </TouchableOpacity>
              <Text className="mt-1 text-xs">{post.comments_count || ''}</Text>
            </View>
            <TouchableOpacity disabled={sharing} onPress={handleShare}>
              <Icon as={Share} size={24} />
              <Text className="mt-1 text-xs" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon as={Flag} size={24} />
              <Text className="mt-1 text-xs" />
            </TouchableOpacity>
          </View>
        </CardFooter>

        {showReactions && (
          <BlurView intensity={30} tint="dark" className="absolute self-start px-3 py-2 ml-6 -mt-6 rounded-full">
            <View className="flex-row items-center gap-3">
              <Text onPress={() => chooseReaction('like')} className="text-xl">👍</Text>
              <Text onPress={() => chooseReaction('love')} className="text-xl">❤️</Text>
              <Text onPress={() => chooseReaction('haha')} className="text-xl">😂</Text>
              <Text onPress={() => chooseReaction('wow')} className="text-xl">😮</Text>
              <Text onPress={() => chooseReaction('sad')} className="text-xl">😢</Text>
              <Text onPress={() => chooseReaction('angry')} className="text-xl">😡</Text>
            </View>
          </BlurView>
        )}

        <PostComments postId={post.id} visible={showComments} onClose={() => setShowComments(false)} />
      </Card>
  );
};

export default PostCard;
