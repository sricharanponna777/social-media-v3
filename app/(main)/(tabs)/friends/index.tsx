import React, { useCallback, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import apiService from '@/lib/api';
import { useSocket } from '@/contexts/SocketContext';

interface FriendRequest {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

const FriendsScreen = () => {
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
      toast.info('New friend request', `${data.display_name} sent you a request`);
      setRequests((prev) => [data, ...prev]);
    });
    const offAccepted = onFriendRequestAccepted((data) =>
      toast.success('Request accepted', `${data.display_name} accepted your request`)
    );
    const offRejected = onFriendRequestRejected((data) =>
      toast.info('Request rejected', `${data.display_name} rejected your request`)
    );
    const offRemoved = onFriendRemoved((data) =>
      toast.info('Friend removed', `${data.display_name} removed you`)
    );
    const offBlocked = onFriendBlocked((data) =>
      toast.error('Blocked', `${data.display_name} blocked you`)
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
      <Text className="font-medium">{item.display_name || item.username}</Text>
      <View className="flex-row space-x-2">
        <Button size="sm" label="Accept" onPress={() => handleAccept(item.id)} />
        <Button size="sm" variant="outline" label="Reject" onPress={() => handleReject(item.id)} />
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="p-4">
        <Text className="text-base font-semibold">
          Connection: {isConnected ? 'online' : 'offline'}
        </Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text className="text-center mt-4">No pending requests</Text>}
      />
    </View>
  );
};

export default FriendsScreen;
