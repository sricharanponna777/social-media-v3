import apiService from '@/lib/api'
import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface RegisterFields {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  countryCode: string
  mobileNumber: string
}

export default function Register() {
  const router = useRouter()
  const [registerFields, setRegisterFields] = useState<RegisterFields>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    countryCode: '',
    mobileNumber: '',
  })

  const updateField = <T extends keyof RegisterFields>(field: T, value: RegisterFields[T]) => {
    setRegisterFields((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = Object.values(registerFields).every((val) => val !== '')

  const handleRegister = async () => {
    if (!isFormValid) return
    try {
      const response = await apiService.registerUser({
        username: registerFields.username,
        email: registerFields.email,
        password: registerFields.password,
        firstName: registerFields.firstName,
        lastName: registerFields.lastName,
        countryCode: parseInt(registerFields.countryCode),
        mobileNumber: registerFields.mobileNumber,
      })
      await AsyncStorage.setItem('otp', response.otp)
      await AsyncStorage.setItem('email', response.user.email)
      await AsyncStorage.setItem('phone', response.user.mobile_number)
      router.replace('/(auth)/verify-otp')
    } catch (error) {
      console.error('Register error:', error)
    }
  }

  return (
    <View style={{ gap: 24, flex: 1, marginVertical: 24, marginHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextInput
          placeholder="First Name"
          value={registerFields.firstName}
          onChangeText={(text) => updateField('firstName', text)}
          style={{ borderWidth: 1, borderRadius: 8, padding: 8, flex: 1 }}
        />
        <TextInput
          placeholder="Last Name"
          value={registerFields.lastName}
          onChangeText={(text) => updateField('lastName', text)}
          style={{ borderWidth: 1, borderRadius: 8, padding: 8, flex: 1 }}
        />
      </View>
      <TextInput
        placeholder="Username"
        value={registerFields.username}
        onChangeText={(text) => updateField('username', text)}
        style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Email"
        value={registerFields.email}
        onChangeText={(text) => updateField('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={registerFields.password}
        onChangeText={(text) => updateField('password', text)}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextInput
          placeholder="Code"
          value={registerFields.countryCode}
          onChangeText={(text) => updateField('countryCode', text)}
          keyboardType="numeric"
          style={{ borderWidth: 1, borderRadius: 8, padding: 8, flex: 0.7 }}
        />
        <TextInput
          placeholder="Phone"
          value={registerFields.mobileNumber}
          onChangeText={(text) => updateField('mobileNumber', text)}
          keyboardType="numeric"
          style={{ borderWidth: 1, borderRadius: 8, padding: 8, flex: 2 }}
        />
      </View>
      <TouchableOpacity
        onPress={handleRegister}
        disabled={!isFormValid}
        style={{
          marginTop: 24,
          backgroundColor: isFormValid ? 'green' : '#ccc',
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Register</Text>
      </TouchableOpacity>
    </View>
  )
}
