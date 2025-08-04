// lib/socketIO.ts
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';

const SOCKET_URL = 'http://192.168.1.233:5001'; // Replace with your backend IP

let socket: Socket | null = null;
let appStateSubscription: { remove: () => void } | null = null;

export const connectSocket = (token: string) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    console.log('🔌 Socket connecting...');
  }

  if (!appStateSubscription) {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    appStateSubscription = subscription;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('❌ Socket disconnected');
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

export const getSocket = (): Socket | null => socket;

function handleAppStateChange(state: AppStateStatus) {
  if (state === 'active' && socket && !socket.connected) {
    console.log('🔁 Reconnecting socket...');
    socket.connect();
  }
}
