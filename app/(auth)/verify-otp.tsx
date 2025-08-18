import React, { useState } from 'react'
import { View, TextInput, Text, TouchableOpacity } from 'react-native'
import apiService from '@/lib/api'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function VerifyOTP() {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  let email: string | null = null
  const fetchData = async () => {
    email = await AsyncStorage.getItem('email')
    await AsyncStorage.getItem('phone')
  }
  fetchData()

  const handleVerify = async (code: string) => {
    try {
      await apiService.verifyOtp({ otp: code, email })
      await AsyncStorage.removeItem('otp')
      await AsyncStorage.removeItem('email')
      await AsyncStorage.removeItem('phone')
      router.replace('/(main)/(tabs)/feed')
    } catch (errorr: any) {
      if (errorr.response?.status === 401) {
        setError('Invalid OTP')
        return
      }
      console.error('Verify error:', errorr)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TextInput
        value={otp}
        onChangeText={(val) => {
          setOtp(val)
          if (val.length === 6) handleVerify(val)
        }}
        keyboardType="number-pad"
        maxLength={6}
        style={{ borderWidth: 1, width: 200, padding: 8, textAlign: 'center', borderRadius: 8 }}
      />
      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
      <TouchableOpacity onPress={() => handleVerify(otp)} style={{ marginTop: 16, backgroundColor: 'green', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Verify</Text>
      </TouchableOpacity>
    </View>
  )
}
