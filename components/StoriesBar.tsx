import React, { useCallback, useMemo } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useRouter } from 'expo-router';
import { API_URL } from '@/constants';

export interface StoryItem {
  id: string;
  username: string;
  avatar_url: string | null | undefined;
}

interface StoriesBarProps {
  stories: StoryItem[] | null | undefined;
}

// Safely build an absolute URL or return null if invalid
function normalizeAvatarUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return null;

  // If already absolute, use as-is
  if (/^https?:\/\//i.test(s)) return s;

  // Otherwise join with API_URL
  const base = (API_URL || '').replace(/\/+$/, '');
  const path = s.replace(/^\/+/, '');
  if (!base) return null;
  return `${base}/${path}`;
}

const ITEM_WIDTH = 72; // avatar 60 + margins; used for getItemLayout

const StoriesBar: React.FC<StoriesBarProps> = ({ stories }) => {
  const router = useRouter();

  const data = useMemo(() => (Array.isArray(stories) ? stories.filter(Boolean) : []), [stories]);

  const keyExtractor = useCallback((item: StoryItem) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }: { item: StoryItem }) => {
      const uri = normalizeAvatarUrl(item.avatar_url);

      return (
        <TouchableOpacity
          onPress={() => router.push(`/story/${item.id}`)}
          style={{ alignItems: 'center', marginRight: 12, width: ITEM_WIDTH }}
        >
          <Avatar size={60} style={{ borderWidth: 2, borderColor: 'pink' }}>
            {uri ? (
              <AvatarImage
                source={{ uri }}
              />
            ) : null}
          </Avatar>
          <Text variant="caption" numberOfLines={1} style={{ marginTop: 4, maxWidth: ITEM_WIDTH }}>
            {item.username || 'User'}
          </Text>
        </TouchableOpacity>
      );
    },
    [router]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_WIDTH + 12, // width + marginRight
      offset: (ITEM_WIDTH + 12) * index,
      index,
    }),
    []
  );

  if (!data.length) return null;

  return (
    <View style={{ paddingVertical: 10 }}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={7}
        getItemLayout={getItemLayout}
        removeClippedSubviews
      />
    </View>
  );
};

export default React.memo(StoriesBar);
