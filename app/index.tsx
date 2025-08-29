import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  console.log('Color scheme:', colorScheme);
  const checkToken = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      router.replace('/feed');
    }
  }

  useEffect(() => {
    checkToken();
  }, []);
  
  return (
    <View className="items-center justify-center flex-1 p-5">
      <Text className="text-3xl font-bold mb-2.5 text-center">Welcome to Our App!</Text>
      <Text className="text-lg text-center mb-7.5">Connect with friends, share your moments, and explore.</Text>
      <Button
        onPress={() => router.replace('/login')} //
        // color="#007AFF" 
        className="bg-green-500 dark:bg-green-600 rounded-[12.5%] mt-5"
        variant={'ghost'}
      >
        <Text>Login</Text>
      </Button>
      <Button
        onPress={() => router.replace('/register')} //
        // color="#007AFF" 
        className="bg-green-500 dark:bg-green-600 rounded-[12.5%] mt-5"
        variant={'ghost'}
      >
        <Text>Register</Text>
      </Button>
    </View>
  );
}
