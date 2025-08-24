
import apiService from '@/lib/api';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { GroupedInput, GroupedInputItem } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { View, Pressable, LogBox, Alert } from 'react-native';
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
      <GroupedInput title="Login">
        <GroupedInputItem
          placeholder="Email"
          value={loginFields.email}
          onChangeText={(text) => updateField('email', text)}
          icon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          spellCheck={false}
        />
        <GroupedInputItem
          placeholder="Password"
          value={loginFields.password}
          onChangeText={(text) => updateField('password', text)}
          icon={Lock}
          secureTextEntry={!showPassword}
          rightComponent={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={22} color={muted} />
              ) : (
                <Eye size={22} color={muted} />
              )}
            </Pressable>
          }
        />
      </GroupedInput>

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