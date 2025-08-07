import { InputOTP } from "@/components/ui/input-otp";
import React, { useState } from "react";
import { View } from "@/components/ui/view";
import apiService from "@/lib/api";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
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
  const { setToken } = useAuth();
  
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
      const authToken = response.data.token;
      await setToken(authToken);
      console.log('Token:', authToken);
      const router = useRouter()
      router.replace('/(tabs)/feed');
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <InputOTP
        length={6}
        value={otp}
        onChangeText={setOtp}
        onComplete={(value) => {
          handleVerify(value);
        }}
        error={error}
      />
    </View>
  )
}