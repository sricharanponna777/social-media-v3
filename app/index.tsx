import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
      <TouchableOpacity
        onPress={() => router.replace('/login')}
        className="bg-green-500 dark:bg-green-600 rounded-lg mt-5 px-4 py-2"
      >
        <Text className="text-white">Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.replace('/register')}
        className="bg-green-500 dark:bg-green-600 rounded-lg mt-5 px-4 py-2"
      >
        <Text className="text-white">Register</Text>
      </TouchableOpacity>
    </View>
  );
}
