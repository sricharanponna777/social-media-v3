import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/theme-provider';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '@/components/ui/toast';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { useColorScheme } from 'react-native';

function InnerLayout() {
  const insets = useSafeAreaInsets();
  const { token, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) return null; // or a loading spinner

  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
      }}
    >
      <ToastProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            {token ? (
              <SocketProvider token={token}>
                <Stack screenOptions={{ headerShown: false }} />
              </SocketProvider>
            ) : (
              <Stack screenOptions={{ headerShown: false }} />
            )}
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InnerLayout />
    </AuthProvider>
  );
}
