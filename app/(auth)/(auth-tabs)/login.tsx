
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
import { View } from '@/components/ui/view';
import { Button } from '@/components/ui/button';
import { Pressable, LogBox } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';

let colorScheme1;

interface LoginFields {
  email: string;
  password: string;
}

export default function Login() {
  const colorScheme = useColorScheme();
  colorScheme1 = colorScheme;
  const router = useRouter();
  const { success, error } = useToast();
  const loginSuccessToast = () => {
    success(
      'Login Successful'
    );
  };

  const loginErrorToast = (err: string) => {
    error(
      'Login Error',
      err
    );
  };
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
      loginSuccessToast();
      router.replace('/feed');
    } catch (error: string | any) {
      console.error('Login error:', error);
      loginErrorToast(error)
    } finally {
      setLoginFields({
        email: '',
        password: ''
      });
    }
  };

  return (
    <View style={{ gap: 24, flex: 1, marginVertical: 24, marginHorizontal: 16 }}>
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
        style={{
          marginTop: 24,
          backgroundColor: isFormValid ? (colorScheme1 === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)') : '#ccc',
        }}
      >
        Login
      </Button>
    </View>
  );
}