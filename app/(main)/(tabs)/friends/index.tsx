import React, { memo, useCallback, useEffect, useState } from 'react';
import { Alert, TouchableOpacity as Button, FlatList, View, KeyboardAvoidingView, Platform, ListRenderItem } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Search, UserPlus, Users, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Input as TextInput } from '@/components/ui/input';
import { debounce } from 'lodash';
import { useRouter } from 'expo-router';

// --- Interfaces (no change) ---
interface FriendRequest {
  id: string;
  user_id: string;
  friend_username: string;
  avatar_url: string | null;
  created_at: string;
}

interface User {
  id: string; // friendship id for friends list, user id for search
  friend_id?: string; // actual user id of the friend (friends list only)
  username: string;
  avatar_url: string | null;
}

interface SearchComponentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearch: (query: string) => void;
  searchResults: User[];
  renderSearchItem: ({ item }: { item: User }) => React.ReactNode;
}

type tabsValueT = 'search' | 'requests' | 'friends';

// =========================================================================
// SOLUTION 1: Move components outside of the main component function.
// They are now stable and won't be redefined on every render.
// They receive all necessary data and functions as props.
// =========================================================================

const SearchComponent = memo(function SearchComponent({
  searchQuery,
  setSearchQuery,
  debouncedSearch,
  searchResults,
  renderSearchItem,
}: SearchComponentProps) {
  return (
    <View>
      <View className="gap-4 p-4">
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            debouncedSearch(text);
          }}
        />
        <Button
          onPress={() => debouncedSearch.flush()}
          className="items-center justify-center w-full h-12 bg-green-500 rounded-full"
        >
          <Text>Search</Text>
        </Button>
      </View>
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSearchItem}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={5}
        ListHeaderComponent={
          <Text className="mb-6 ml-6 text-2xl font-bold text-foreground">
            Search Results
          </Text>
        }
        ListEmptyComponent={
          <Text className="mt-4 text-center text-opacity-50 text-foreground">
            No users found
          </Text>
        }
      />
    </View>
  );
});


const IncomingFriendRequestsComponent = React.memo(function IncomingFriendRequestsComponent({
  incomingRequests,
  renderRequestItem,
}: {
  incomingRequests: FriendRequest[];
  renderRequestItem: ({ item }: { item: FriendRequest }) => React.ReactNode;
}) {
  return (
    <FlatList
      data={incomingRequests}
      keyExtractor={(item) => item.id}
      renderItem={renderRequestItem}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={12}
      windowSize={5}
      ListFooterComponent={<View className="py-4" />}
      ListHeaderComponent={
        <Text className="mt-6 mb-3 ml-6 text-xl font-bold text-black dark:text-white">
          Incoming Friend Requests
        </Text>
      }
      ListEmptyComponent={
        <Text className="mt-4 text-center text-black dark:text-white">No incoming friend requests</Text>
      }
    />
  );
});


// IMPROVEMENT 1: Outgoing requests should not have accept/reject buttons.
// Create a separate, simpler render item for them.
const renderOutgoingRequestItem = ({ item }: { item: FriendRequest }) => (
    <View className="flex-row items-center justify-between px-4 py-4 border-gray-100 rounded border-y dark:border-gray-900">
        <Text className="font-medium text-black dark:text-white">{item.friend_username}</Text>
        <Text className="text-sm text-gray-500">Pending</Text>
    </View>
);

const OutgoingFriendRequestsComponent = React.memo(function OutgoingFriendRequestsComponent({
  outgoingRequests,
}: {
  outgoingRequests: FriendRequest[];
}) {
  return (
    <FlatList
      data={outgoingRequests}
      keyExtractor={(item) => item.id}
      renderItem={renderOutgoingRequestItem}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={12}
      windowSize={5}
      ListFooterComponent={<View className="py-4" />}
      ListHeaderComponent={
        <Text className="mb-3 ml-6 text-xl font-bold text-black dark:text-white">
          Outgoing Friend Requests
        </Text>
      }
      ListEmptyComponent={
        <Text className="mt-4 text-center text-black dark:text-white">No outgoing friend requests</Text>
      }
    />
  );
});

const FriendsComponent = React.memo(function FriendsComponent({
  friends,
  renderFriendItem,
}: {
  friends: User[];
  renderFriendItem: ({ item }: { item: User }) => React.ReactNode;
}) {
  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.id}
      renderItem={renderFriendItem as any}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={10}
      maxToRenderPerBatch={15}
      windowSize={7}
      ListHeaderComponent={
        <Text className="mb-6 ml-6 text-2xl font-bold text-black dark:text-white">Friends</Text>
      }
      ListEmptyComponent={
        <Text className="mt-4 text-center text-black dark:text-white">You have no friends yet.</Text>
      }
    />
  );
});


const FriendsScreen = () => {
  const router = useRouter();
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [privateConvoByFriendId, setPrivateConvoByFriendId] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [tabsValue, setTabsValue] = useState<tabsValueT>('search');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const {
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendBlocked,
    isConnected,
  } = useSocket();

  // --- Pulse animation setup (no change) ---
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isConnected) {
      scale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isConnected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // --- Fetch data (no change) ---
  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiService.getFriendRequests();
      setIncomingRequests(Array.isArray(data?.incoming) ? data.incoming : []);
      setOutgoingRequests(Array.isArray(data?.outgoing) ? data.outgoing : []);
    } catch (error) {
      console.error('Failed to load friend requests', error);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const data = await apiService.getFriends();
      setFriends(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load friends', error);
      setFriends([]);
    }
  }, []);

  const fetchPrivateConversations = useCallback(async () => {
    try {
      const convos: any[] = await apiService.getConversations(1, 100);
      const map: Record<string, string> = {};
      (Array.isArray(convos) ? convos : []).forEach((c: any) => {
        if (c.type === 'private' && c.other_user_id) {
          map[c.other_user_id] = c.id;
        }
      });
      setPrivateConvoByFriendId(map);
    } catch (e) {
      console.error('Failed to load private conversations', e);
      setPrivateConvoByFriendId({});
    }
  }, []);

  // Refresh whenever screen is focused (no change)
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      fetchFriends();
      fetchPrivateConversations();
    }, [fetchRequests, fetchFriends, fetchPrivateConversations])
  );

  // --- Socket listeners ---
  useEffect(() => {
    const offRequest = onFriendRequest((data) => {
      Alert.alert('New friend request', `${data.friend_username} sent you a request`);
      setIncomingRequests((prev) => [data, ...prev]);
    });
    const offAccepted = onFriendRequestAccepted((data) => {
      Alert.alert('Request accepted', `${data.friend_username} accepted your request`);
      // IMPROVEMENT 2: Also update the outgoing requests list for a complete optimistic update
      setOutgoingRequests((prev) => prev.filter((r) => r.friend_username !== data.friend_username));
      setFriends((prev) => [
        ...prev,
        { id: data.user_id, username: data.friend_username, avatar_url: data.avatar_url },
      ]);
    });
    const offRejected = onFriendRequestRejected((data) => {
      Alert.alert('Request rejected', `${data.friend_username} rejected your request`);
      // Remove from outgoing requests as well
      setOutgoingRequests((prev) => prev.filter((r) => r.friend_username !== data.friend_username));
    });
    const offRemoved = onFriendRemoved((data) => {
      Alert.alert('Friend removed', `${data.friend_username} removed you`);
      setFriends((prev) => prev.filter((f) => f.id !== data.user_id));
    });
    const offBlocked = onFriendBlocked((data) =>
      Alert.alert('Blocked', `${data.friend_username} blocked you`)
    );
    return () => {
      offRequest();
      offAccepted();
      offRejected();
      offRemoved();
      offBlocked();
    };
  }, [
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendBlocked,
  ]);

  // --- Handlers (no change) ---
  const handleAccept = useCallback(async (id: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiService.acceptFriendRequest(id);
      fetchFriends();
    } catch (error) {
      console.error('Accept failed', error);
      fetchRequests(); // rollback
    }
  }, [fetchFriends, fetchRequests]);

  const handleReject = useCallback(async (id: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await apiService.rejectFriendRequest(id);
    } catch (error) {
      console.error('Reject failed', error);
      fetchRequests(); // rollback
    }
  }, [fetchRequests]);

  const handleAddFriend = useCallback(async (id: string) => {
    try {
      const response = await apiService.sendFriendRequest(id);
      Alert.alert('Friend request sent', 'Friend request sent successfully');
      // Optimistically add to outgoing requests
      setOutgoingRequests(prev => [response, ...prev]);
    } catch (error) {
      console.error('Add friend failed', error);
      Alert.alert('Error', 'Failed to send friend request.');
    }
  }, []);

  const handleStartChat = useCallback(async (friend: User) => {
    try {
      const conv = await apiService.createConversation({
        title: friend.username,
        participants: [friend.friend_id],
        type: 'private',
      });
      setPrivateConvoByFriendId((prev) => ({ ...prev, [friend.friend_id]: conv.id }));
      router.push({ pathname: '/(main)/(chats)/[id]', params: { id: conv.id } });
    } catch (error) {
      console.error('Start chat failed', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  }, [router]);

  // --- Debounced search (no change) ---
  const debouncedSearch = useCallback(
    ()=>{debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await apiService.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed', error);
      }
    }, 400)}, []);

  // --- Render Items (memoized with useCallback) ---
  const renderRequestItem = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <View className="flex-row items-center justify-between px-4 py-4 border-gray-100 rounded border-y dark:border-gray-900">
        <Text className="font-medium text-black dark:text-white">{item.friend_username}</Text>
        <View className="flex-row justify-end w-48 gap-2">
          <Button
            onPress={() => handleAccept(item.id)}
            className="items-center justify-center w-12 h-12 bg-green-500 rounded-full"
          >
            <Icon as={Check} size={24} />
          </Button>
          <Button
            onPress={() => handleReject(item.id)}
            className="items-center justify-center w-12 h-12 bg-red-500 rounded-full"
          >
            <Icon as={X} size={24} />
          </Button>
        </View>
      </View>
    ),
    [handleAccept, handleReject]
  );

  const renderSearchItem: ListRenderItem<User> = useCallback(
    ({ item }) => {
      if (!item) return null;
      return (
        <View className="flex-row items-center justify-between px-4 py-2 border-gray-200 border-y dark:border-gray-700">
          <Text className="font-medium text-black dark:text-white">{item.username}</Text>
          <Button
            onPress={() => handleAddFriend(item.id)}
            className="items-center justify-center h-auto p-2 bg-green-500 rounded-3xl"
          >
            <Text>Add Friend</Text>
          </Button>
        </View>
      );
    },
    [handleAddFriend]
  );

  const renderFriendItem = useCallback(
    ({ item }: { item: User }) => {
      const existingConvoId = privateConvoByFriendId[item.friend_id];
      const onPress = () => {
        if (existingConvoId) {
          router.push({ pathname: '/(main)/(chats)/[id]', params: { id: existingConvoId } });
        } else {
          handleStartChat(item);
        }
      };
      return (
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <Text className="font-medium text-foreground">{item.username}</Text>
          <Button onPress={onPress} className="items-center justify-center h-auto px-4 py-2 bg-green-500 rounded-full">
            <Text className="text-white">{existingConvoId ? 'Open Chat' : 'Message'}</Text>
          </Button>
        </View>
      );
    },
    [privateConvoByFriendId, router, handleStartChat]
  );

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 pt-20 bg-white dark:bg-black">
        {/* Connection status (no change) */}
        <View className="flex-row items-center pl-4 mb-4">
          {isConnected ? (
            <Animated.View
              style={animatedStyle}
              className="w-3 h-3 mr-2 bg-green-500 rounded-full"
            />
          ) : (
            <View className="w-3 h-3 mr-2 bg-yellow-400 rounded-full" />
          )}
          <Text className="text-base font-semibold text-black dark:text-white">
            Connection Status: {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>

        <Tabs value={tabsValue} onValueChange={(value: string) => setTabsValue(value as tabsValueT)}>
          <TabsList className="flex-row self-center justify-around p-2 mx-[25%]">
            <TabsTrigger value="search" className="h-12">
              <Icon as={Search} className="w-5 h-5 mr-2" />
              <Text>Search</Text>
            </TabsTrigger>
            <TabsTrigger value="requests" className="h-12">
              <Icon as={UserPlus} className="w-5 h-5 mr-2" />
              <Text>Requests</Text>
            </TabsTrigger>
            <TabsTrigger value="friends" className="h-12">
              <Icon as={Users} className="w-5 h-5 mr-2" />
              <Text>Friends</Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search">
            {/* SOLUTION 2: Render the external component and pass props */}
            <SearchComponent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              debouncedSearch={debouncedSearch}
              searchResults={searchResults}
              renderSearchItem={renderSearchItem}
            />
          </TabsContent>
          <TabsContent value="requests">
            <Text className="mb-4 ml-6 text-3xl font-bold text-foreground">Friend Requests</Text>
            <IncomingFriendRequestsComponent
                incomingRequests={incomingRequests}
                renderRequestItem={renderRequestItem}
            />
            <OutgoingFriendRequestsComponent
                outgoingRequests={outgoingRequests}
            />
          </TabsContent>
          <TabsContent value="friends">
            <FriendsComponent friends={friends} renderFriendItem={renderFriendItem} />
          </TabsContent>
        </Tabs>
      </View>
    </KeyboardAvoidingView>
  );
};

export default FriendsScreen;
