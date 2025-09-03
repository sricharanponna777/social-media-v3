import { router, Stack } from 'expo-router';
import '../global.css';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/theme-provider';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { useColorScheme } from 'react-native';
import apiService from '@/lib/api';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://7e10365bc0eca8538e0947083d5a74a2@o4509768871772160.ingest.us.sentry.io/4509768883699712',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function InnerLayout() {
  const insets = useSafeAreaInsets();
  const { token, isLoading, removeToken } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const validateToken = async () => {
    try {
      console.log(`Validating token: ${token}`);
      const response = await apiService.validateToken({ token });
      if (response.verified) {
        console.log('Token is valid');
      } else {
        removeToken();
        console.log('Token is invalid');
        router.replace('/')
      }
    } catch (error) {
      console.error('Token validation failed:', error);
    }
  };
    if (token) {
      validateToken();
    }
  }, [token, removeToken]);

  if (isLoading) {
    return (
      <GestureHandlerRootView className='flex-1'>
        {/* You can put a spinner here */}
      </GestureHandlerRootView>
    );
  }

  const renderContent = () => {
    if (token) {
      return (
        <SocketProvider token={token}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" />
          </Stack>
        </SocketProvider>
      );
    } else {
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="index" />
        </Stack>
      );
    }
  };

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
      }}
      // className={`flex-1 pt-[${insets.top}] pl-[${insets.left}] pr-[${insets.right}] dark:bg-black bg-white`}
    >
        <SafeAreaProvider>
          <ThemeProvider>
            {renderContent()}
            <StatusBar style="auto" />
            <PortalHost />
          </ThemeProvider>
        </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <AuthProvider>
      <InnerLayout />
    </AuthProvider>
  );
});