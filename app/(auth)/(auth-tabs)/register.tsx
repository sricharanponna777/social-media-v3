
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
import * as SecureStore from 'expo-secure-store';
import { useToast } from '@/components/ui/toast';

let colorScheme1;
interface RegisterFields {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryCode: number | null;
  mobileNumber: bigint | null;
}

export default function Register() {
  const colorScheme = useColorScheme();
  colorScheme1 = colorScheme;
  const router = useRouter();
  const { success, error } = useToast();
  const registrationSuccessToast = () => {
    success(
      'Registration Successful',
      'Please check your email and phone to verify your account'
    );
  };

  const registrationErrorToast = () => {
    error(
      'Registration Error', 
      'Please try again later'
    );
  };
  LogBox.ignoreAllLogs();
  const [registerFields, setRegisterFields] = useState<RegisterFields>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    countryCode: null,
    mobileNumber: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const muted = useThemeColor({}, 'mutedForeground');

  const updateField = <T extends keyof RegisterFields>(
    field: T,
    value: RegisterFields[T]
  ) => {
    setRegisterFields((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(registerFields).every(
    (val) => val !== null && val !== ''
  );

  const handleRegister = async () => {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      countryCode,
      mobileNumber,
    } = registerFields;

    if (!isFormValid) return;

    try {
      const response = await apiService.registerUser({
        username,
        email,
        password,
        firstName,
        lastName,
        countryCode: countryCode as number,
        mobileNumber: mobileNumber?.toString() ?? '', 
      });
      console.log('Register response:', response);
      await SecureStore.setItemAsync('otp', response.otp);
      await SecureStore.setItemAsync('email', response.user.email);
      await SecureStore.setItemAsync('phone', response.user.mobile_number);
      registrationSuccessToast();
    } catch (error) {
      console.error('Register error:', error);
      registrationErrorToast();
    } finally {
      setRegisterFields({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        countryCode: null,
        mobileNumber: null,
      });
      router.replace('/(auth)/verify-otp');
    }
  };

  return (
    <View style={{ gap: 24, flex: 1, marginVertical: 24, marginHorizontal: 16 }}>
      <GroupedInput title="Register">
        {/* First Name and Last Name in one row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
          <GroupedInputItem
              placeholder="First Name"
              value={registerFields.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              icon={User}
              keyboardType="default"
          />
          </View>
          <View style={{ flex: 1 }}>
          <GroupedInputItem
              placeholder="Last Name"
              value={registerFields.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              icon={User}
              keyboardType="default"
          />
          </View>
        </View>

      <GroupedInputItem
          placeholder="Username"
          value={registerFields.username}
          onChangeText={(text) => updateField('username', text)}
          icon={User}
          keyboardType="email-address"
          autoCapitalize="none"
      />

      <GroupedInputItem
          placeholder="Email"
          value={registerFields.email}
          onChangeText={(text) => updateField('email', text)}
          icon={Mail}
          keyboardType="email-address"
          autoCapitalize="none"
          spellCheck={false}
      />

      <GroupedInputItem
          placeholder="Password"
          value={registerFields.password}
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
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Country Code */}
            <View style={{ flex: 0.7 }}>
              <GroupedInputItem
                placeholder="Code"
                value={registerFields.countryCode?.toString() ?? ''}
                onChangeText={(text) => {
                  if (text === '') {
                    updateField('countryCode', null);
                  } else {
                    const num = parseInt(text);
                    updateField('countryCode', isNaN(num) ? null : num);
                  }
                }}
                icon={Plus}
                keyboardType="numeric"
              />
            </View>

            {/* Phone Number */}
            <View style={{ flex: 2 }}>
              <GroupedInputItem
                placeholder="Phone"
                value={registerFields.mobileNumber?.toString() ?? ''}
                onChangeText={(text) => {
                  if (text === '') {
                    updateField('mobileNumber', null);
                  } else {
                    try {
                      const number = BigInt(text);
                      updateField('mobileNumber', number);
                    } catch {
                      updateField('mobileNumber', null);
                    }
                  }
                }}
                icon={Phone}
                keyboardType="numeric"
              />
            </View>
          </View>
      </GroupedInput>



      <Button
        onPress={handleRegister}
        disabled={!isFormValid}
        style={{
          marginTop: 24,
          backgroundColor: isFormValid ? (colorScheme1 === 'dark' ? 'rgb(52, 199, 89)' : 'rgb(48, 209, 88)') : '#ccc',
        }}
      >
        Register
      </Button>
    </View>
  );
}