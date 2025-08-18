import apiService from '@/lib/api'
import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'

interface LoginFields {
  email: string
  password: string
}

export default function Login() {
  const router = useRouter()
  const [loginFields, setLoginFields] = useState<LoginFields>({ email: '', password: '' })

  const updateField = <T extends keyof LoginFields>(field: T, value: LoginFields[T]) => {
    setLoginFields((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = Object.values(loginFields).every((val) => val !== '')

  const handleLogin = async () => {
    if (!isFormValid) return
    try {
      await apiService.loginUser({ email: loginFields.email, password: loginFields.password })
      router.replace('/feed')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoginFields({ email: '', password: '' })
    }
  }

  return (
    <View style={{ gap: 24, flex: 1, marginVertical: 24, marginHorizontal: 16 }}>
      <TextInput
        placeholder="Email"
        value={loginFields.email}
        onChangeText={(text) => updateField('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={loginFields.password}
        onChangeText={(text) => updateField('password', text)}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 8, padding: 8 }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={!isFormValid}
        style={{
          marginTop: 24,
          backgroundColor: isFormValid ? 'green' : '#ccc',
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white' }}>Login</Text>
      </TouchableOpacity>
    </View>
  )
}
