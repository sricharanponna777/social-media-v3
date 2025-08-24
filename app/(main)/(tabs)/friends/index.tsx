import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View, Button } from 'react-native';
import apiService from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { useHeaderHeight } from '@react-navigation/elements';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface FriendRequest {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

const FriendsScreen = () => {
  const pt = useHeaderHeight();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const {
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendBlocked,
    isConnected,
  } = useSocket();

  // --- Pulse animation setup ---
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isConnected) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1, // infinite loop
        true // reverse
      );
    } else {
      scale.value = 1; // reset when offline
    }
  }, [isConnected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // --- Fetch requests ---
  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiService.getFriendRequests();
      setRequests(Array.isArray(data?.incoming) ? data.incoming : []);
    } catch (error) {
      console.error('Failed to load friend requests', error);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // --- Socket listeners ---
  useEffect(() => {
      const offRequest = onFriendRequest((data) => {
        Alert.alert('New friend request', `${data.username} sent you a request`)
        setRequests((prev) => [data, ...prev])
      })
      const offAccepted = onFriendRequestAccepted((data) =>
        Alert.alert('Request accepted', `${data.username} accepted your request`)
      )
      const offRejected = onFriendRequestRejected((data) =>
        Alert.alert('Request rejected', `${data.username} rejected your request`)
      )
      const offRemoved = onFriendRemoved((data) =>
        Alert.alert('Friend removed', `${data.username} removed you`)
      )
      const offBlocked = onFriendBlocked((data) =>
        Alert.alert('Blocked', `${data.username} blocked you`)
      )
    return () => {
      offRequest();
      offAccepted();
      offRejected();
      offRemoved();
      offBlocked()
    }
  }, [
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendBlocked,
  ])

  // --- Handle accept/reject ---
  const handleAccept = async (id: string) => {
    try {
      await apiService.acceptFriendRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Accept failed', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiService.rejectFriendRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Reject failed', error);
    }
  };

  const renderItem = ({ item }: { item: FriendRequest }) => (
    <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <Text className="font-medium text-black dark:text-white">
        {item.username}
      </Text>
      <View className="flex-row space-x-2">
        <Button title="Accept" onPress={() => handleAccept(item.id)} />
        <Button title="Reject" onPress={() => handleReject(item.id)} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* Connection status */}
      <View className="flex-row items-center pl-4 mt-20">
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

      {/* Friend requests list */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        className='mt-10'
        ListHeaderComponent={
          <Text className="mb-6 ml-6 text-2xl font-bold text-black dark:text-white">
            Friend Requests 
          </Text>
        }
        ListEmptyComponent={
          <Text className="mt-4 text-center text-black dark:text-white">
            No pending requests
          </Text>
        }
      />
    </View>
  );
};

export default FriendsScreen;
