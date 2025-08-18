import { View } from '@/components/ui/view'
import { Text } from '@/components/ui/text'
import React, { useEffect, useState } from 'react'
import { FlashList } from '@shopify/flash-list';
import apiService from '@/lib/api';
import PostCard from '@/components/PostCard';
import { useHeaderHeight } from "@react-navigation/elements";
import Pagination from '@/components/pagination';

interface Post {
  id: string;
  content: string;
  media_urls: string[];
  user_id: string;
  username: string;
  avatar_url: string;
  full_name: string;
}

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limit = 20;
  const paddingTop = useHeaderHeight();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response: Post[] = await apiService.getFeed(page, limit);
        setPosts(response); // adjust based on your API response structure
        setTotalPages(Math.ceil(response.length / limit)); // assuming your API returns total count
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchPosts();
  }, [page]);

  return (
    <View style={{ flex: 1, paddingTop }}>
      
      <FlashList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination component */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </View>
  )
}
