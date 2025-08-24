
import React, { useCallback, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Text } from './ui/text';
import { Icon } from './ui/icon';
import { Flag, MessageCircle, Share, ThumbsUp } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  TouchableOpacity,
  ScrollView,
  View,
  NativeSyntheticEvent,
  TextLayoutEventData,
} from 'react-native';
import { Image } from 'expo-image';
import { API_URL } from '@/constants';
import { BORDER_RADIUS } from '@/theme/globals';
import _ from 'lodash';

export interface Post {
  id: string;
  content: string;
  media_urls: string[];
  user_id: string;
  username: string;
  avatar_url: string;
  full_name: string;
}

interface PostCardProps {
  post: Post;
}

function getMediaType(fileNameOrMime: string): "video" | "image" | "unknown" {
  // Normalise input
  const input = fileNameOrMime.toLowerCase().trim();

  // Common MIME type checks
  if (input.startsWith("image/")) return "image";
  if (input.startsWith("video/")) return "video";

  // Common file extension checks
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"];
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];

  const extMatch = input.match(/\.([a-z0-9]+)$/);
  if (extMatch) {
    const ext = extMatch[1];
    if (imageExts.includes(ext)) return "image";
    if (videoExts.includes(ext)) return "video";
  }

  return "unknown";
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [sharing, setSharing] = useState<boolean>(false)
  const [sizeOfTextBox, setSizeOfTextBox] = useState(10);
  
  const handleShare = async () => {
    setSharing(true)
};
    const images = _.map(post.media_urls, (str) => ({ uri: str, caption: post.content }))
    const longPressGesture = Gesture.LongPress().onEnd((e, success) => {
      if (success) {
        console.log(`Long pressed for ${e.duration} ms!`)
        // Open Reaction Bar
      }
    })

  const onTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    const lineCount = lines.length * 10;
    setSizeOfTextBox(lineCount)
  }, [post.content])

  return (
      <Card className="my-2.5">
        <CardHeader>
          <View className="flex-row items-center">
            <Text className="ml-2.5">Posted By {post.full_name}</Text>
          </View>
        </CardHeader>
        <CardContent>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ height: images.length ? 240 : sizeOfTextBox, borderRadius: BORDER_RADIUS }}
          >
            {images.map((image, index) => (
              <View key={index} style={{ padding: 0, width: '100%' }}>
                <View className="relative">
                  {getMediaType(image.uri) === 'image' ? (
                    <Image
                      source={{ uri: `${API_URL}${image.uri}` }}
                      style={{
                        width: '100%',
                        height: 240,
                        borderRadius: BORDER_RADIUS,
                      }}
                      contentFit="cover"
                    />
                  ) : getMediaType(image.uri) === 'video' ? (
                    <Text>Video not supported</Text>
                  ) : (
                    <View>
                      <Text>{post.content}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
          <Text className="mt-2.5" onTextLayout={onTextLayout}>
            {post.content}
          </Text>
        </CardContent>
        <CardFooter>
          <View className="flex-row justify-between pr-5">
            <TouchableOpacity>
              <GestureDetector gesture={longPressGesture}>
                <Icon name={ThumbsUp} size={24} />
              </GestureDetector>
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name={MessageCircle} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Icon name={Share} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name={Flag} />
            </TouchableOpacity>
          </View>
        </CardFooter>
      </Card>
  );
};

export default PostCard;
