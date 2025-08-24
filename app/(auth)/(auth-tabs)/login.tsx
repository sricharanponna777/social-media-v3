
import apiService from '@/lib/api';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { View, Pressable, LogBox, Alert, Text, TextInput } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

let colorScheme1;

interface LoginFields {
  email: string;
  password: string;
}

export default function Login() {
  const colorScheme = useColorScheme();
  colorScheme1 = colorScheme;
  const router = useRouter();
  LogBox.ignoreAllLogs();
  const [loginFields, setLoginFields] = useState<LoginFields>({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const muted = useThemeColor({}, 'mutedForeground');

  const updateField = <T extends keyof LoginFields>(
    field: T,
    value: LoginFields[T]
  ) => {
    setLoginFields((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(loginFields).every(
    (val) => val !== null && val !== ''
  );

  const handleLogin = async () => {
    const {
      email,
      password
    } = loginFields;

    if (!isFormValid) return;

    try {
      const response = await apiService.loginUser({
        email,
        password,
      });
      console.log('Login response:', response);
      Alert.alert('Login Successful');
      router.replace('/feed');
    } catch (error: string | any) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error);
    } finally {
      setLoginFields({
        email: '',
        password: ''
      });
    }
  };

  return (
    <View className="flex-1 gap-6 my-6 mx-4">
      <View className="rounded-xl border border-input bg-background p-4">
        <Text className="mb-2 text-xl font-semibold">Login</Text>
        <View className="gap-4">
          <View className="flex-row items-center rounded-md border border-input px-3">
            <Mail size={20} color={muted} />
            <TextInput
              className="flex-1 px-2 py-2 text-base"
              placeholder="Email"
              value={loginFields.email}
              onChangeText={(text: string) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>
          <View className="flex-row items-center rounded-md border border-input px-3">
            <Lock size={20} color={muted} />
            <TextInput
              className="flex-1 px-2 py-2 text-base"
              placeholder="Password"
              value={loginFields.password}
              onChangeText={(text: string) => updateField('password', text)}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={22} color={muted} />
              ) : (
                <Eye size={22} color={muted} />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <Button
        onPress={handleLogin}
        disabled={!isFormValid}
        className="mt-6"
        style={{
          backgroundColor: isFormValid ? (colorScheme1 === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)') : '#ccc',
        }}
      >
        Login
      </Button>
    </View>
  );
}