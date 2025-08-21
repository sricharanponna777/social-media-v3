// contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';

type FriendRequest = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

type FriendEvent = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onFriendRequest: (callback: (data: FriendRequest) => void) => () => void;
  onFriendRequestAccepted: (callback: (data: FriendEvent) => void) => () => void;
  onFriendRequestRejected: (callback: (data: FriendEvent) => void) => () => void;
  onFriendRemoved: (callback: (data: FriendEvent) => void) => () => void;
  onFriendBlocked: (callback: (data: FriendEvent) => void) => () => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onFriendRequest: () => () => {},
  onFriendRequestAccepted: () => () => {},
  onFriendRequestRejected: () => () => {},
  onFriendRemoved: () => () => {},
  onFriendBlocked: () => () => {},
});

const SOCKET_URL = 'http://192.168.1.233:5001'; // Change to your backend IP

export const SocketProvider = ({ token, children }: { token: string; children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Friend request event handlers
  const onFriendRequest = useCallback((callback: (data: FriendRequest) => void) => {
    if (!socket) return () => {};
    
    socket.on('friend_request', callback);
    return () => socket.off('friend_request', callback);
  }, [socket]);
  
  const onFriendRequestAccepted = useCallback((callback: (data: FriendEvent) => void) => {
    if (!socket) return () => {};
    
    socket.on('friend_request_accepted', callback);
    return () => socket.off('friend_request_accepted', callback);
  }, [socket]);
  
  const onFriendRequestRejected = useCallback((callback: (data: FriendEvent) => void) => {
    if (!socket) return () => {};
    
    socket.on('friend_request_rejected', callback);
    return () => socket.off('friend_request_rejected', callback);
  }, [socket]);
  
  const onFriendRemoved = useCallback((callback: (data: FriendEvent) => void) => {
    if (!socket) return () => {};

    socket.on('friend_removed', callback);
    return () => socket.off('friend_removed', callback);
  }, [socket]);

  const onFriendBlocked = useCallback((callback: (data: FriendEvent) => void) => {
    if (!socket) return () => {};

    socket.on('friend_blocked', callback);
    return () => socket.off('friend_blocked', callback);
  }, [socket]);

  // Connect socket on mount
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });

    console.log('🔌 Connecting socket...');

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  // Reconnect on app state change
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active' && socket && !socket.connected) {
        console.log('🔁 App resumed — reconnecting socket...');
        socket.connect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onFriendRequest,
      onFriendRequestAccepted,
      onFriendRequestRejected,
      onFriendRemoved,
      onFriendBlocked
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
