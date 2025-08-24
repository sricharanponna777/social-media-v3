import React, { useState } from "react";
import { View, TextInput } from "react-native";
import { Text } from "@/components/ui/text";
import apiService from "@/lib/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyOTP() {
  let email: string | null = null;
  let phone: string | null = null;
  const fetchData = async () => {
    email = await AsyncStorage.getItem('email');
    phone = await AsyncStorage.getItem('phone');
  }
  fetchData().then(() => {
    console.log('Email:', email);
    console.log('Phone:', phone);
  });
  const [otp, setOtp] = useState<string>('')
  const [error, setError] = useState<string>('')
  const router = useRouter()
  
  const handleVerify = async (otp: string) => {
    try {
      const response = await apiService.verifyOtp({
        otp,
        email
      });
      console.log('Verify response:', response);
      await AsyncStorage.removeItem('otp');
        await AsyncStorage.removeItem('email');
        await AsyncStorage.removeItem('phone')
        const authToken = response.token;
        console.log('Token:', authToken);
        router.replace('/(main)/(tabs)/feed');
    } catch (errorr: any) {
      if (errorr.response?.status === 401) {
        console.log('OTP is invalid');
        setError('Invalid OTP');
        return;
      }
      console.error('Verify error:', errorr);
    }
  } 

  return (
    <View className="flex-1 items-center justify-center">
      <TextInput
        className="w-40 p-2 text-lg text-center border border-gray-300 rounded-lg"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(value) => {
          setOtp(value);
          if (value.length === 6) handleVerify(value);
        }}
      />
      {error ? <Text className="mt-2 text-red-500">{error}</Text> : null}
    </View>
  )
}