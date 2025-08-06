import { InputOTP } from "@/components/ui/input-otp";
import React, { useEffect, useState } from "react";
import { View } from "@/components/ui/view";
import * as SecureStore from "expo-secure-store";
import apiService from "@/lib/api";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyOTP() {
  const [otp, setOtp] = useState<string>('')
  const [error, setError] = useState<string>('')
  const { setToken } = useAuth();
  
  const handleVerify = async (otp: string) => {
    try {
      const email = await SecureStore.getItemAsync('email');
      const phone = await SecureStore.getItemAsync('phone');
      const response = await apiService.verifyOtp({
        otp,
        email,
        phone
      });
      console.log('Verify response:', response);
      await SecureStore.deleteItemAsync('otp');
      await SecureStore.deleteItemAsync('email');
      await SecureStore.deleteItemAsync('phone')
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