import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View, Button } from 'react-native';
import { useToast } from '@/components/ui/toast';
import apiService from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';
import { useHeaderHeight } from '@react-navigation/elements';

interface FriendRequest {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

const FriendsScreen = () => {
  const pt = useHeaderHeight()
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const {
    onFriendRequest,
    onFriendRequestAccepted,
    onFriendRequestRejected,
    onFriendRemoved,
    onFriendBlocked,
    isConnected,
  } = useSocket();
  const toast = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiService.getFriendRequests();
      setRequests(data.incoming || []);
    } catch (error) {
      console.error('Failed to load friend requests', error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const offRequest = onFriendRequest((data) => {
      toast.info('New friend request', `${data.username} sent you a request`);
      setRequests((prev) => [data, ...prev]);
    });
    const offAccepted = onFriendRequestAccepted((data) =>
      toast.success('Request accepted', `${data.username} accepted your request`)
    );
    const offRejected = onFriendRequestRejected((data) =>
      toast.info('Request rejected', `${data.username} rejected your request`)
    );
    const offRemoved = onFriendRemoved((data) =>
      toast.info('Friend removed', `${data.username} removed you`)
    );
    const offBlocked = onFriendBlocked((data) =>
      toast.error('Blocked', `${data.username} blocked you`)
    );
    return () => {
      offRequest();
      offAccepted();
      offRejected();
      offRemoved();
      offBlocked();
    };
  }, [onFriendRequest, onFriendRequestAccepted, onFriendRequestRejected, onFriendRemoved, onFriendBlocked, toast]);

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
    <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200">
      <Text className="font-medium">{item.username}</Text>
      <View className="flex-row space-x-2">
        <Button title="Accept" onPress={() => handleAccept(item.id)} />
        <Button title="Reject" onPress={() => handleReject(item.id)} />
      </View>
    </View>
  );

  return (
    <View className={`flex-1 bg-[#F2F2F7] dark:bg-[#1C1C1E] pt-[${pt}]`}>
      <View className="p-4">
        <Text className={`text-base font-semibold`}>
          Connection: {isConnected ? 'online' : 'offline'}
        </Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text className="mt-4 text-center">No pending requests</Text>}
      />
    </View>
  );
};

export default FriendsScreen;
