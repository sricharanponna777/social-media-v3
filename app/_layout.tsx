import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/theme-provider';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '@/components/ui/toast';
import { Provider } from 'react-redux';
import { persistor, store } from '@/redux/store';
import { PersistGate } from 'redux-persist/integration/react';

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  return (
    <GestureHandlerRootView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ToastProvider>
            <SafeAreaProvider>
              <ThemeProvider>
                <Stack
                  screenOptions={{
                    headerShown: false
                  }}
                />
                <StatusBar style='auto' />
              </ThemeProvider>
            </SafeAreaProvider>
          </ToastProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
