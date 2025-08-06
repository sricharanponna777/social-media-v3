import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { GroupedInput, GroupedInputItem } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useRouter } from "expo-router";
import { useToast } from "@/components/ui/toast";
import { LogBox, Pressable } from "react-native";
import React, { useState } from "react";
import apiService from "@/lib/api";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";

interface LoginFields {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { success, error } = useToast();
  const loginSuccessToast = () => {
    success(
      "Login Successful"
    );
  };

  const loginErrorToast = () => {
    error(
      "Login Error"
    );
  };
  LogBox.ignoreAllLogs();
  const [loginFields, setLoginFields] = useState<LoginFields>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const muted = useThemeColor({}, "mutedForeground");

  const updateField = <T extends keyof LoginFields>(
    field: T,
    value: LoginFields[T]
  ) => {
    setLoginFields((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Object.values(loginFields).every(
    (val) => val !== null && val !== ""
  );

  const handleLogin = async () => {
    const { email, password } = loginFields;

    if (!isFormValid) return;

    try {
      const response = await apiService.loginUser({
        email,
        password,
      });
      console.log("Login response:", response);
      loginSuccessToast();
    } catch (error) {
      console.error("Login error:", error);
      loginErrorToast();
    } finally {
      setLoginFields({
        email: "",
        password: "",
      });
      router.replace("/(tabs)/feed");
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <GroupedInput title="Login">
        {/* Email */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <GroupedInputItem
              placeholder="Email"
              value={loginFields.email}
              onChangeText={(text) => updateField("email", text)}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>
        </View>

        {/* Password */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <GroupedInputItem
              placeholder="Password"
              value={loginFields.password}
              onChangeText={(text) => updateField("password", text)}
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
          </View>
        </View>
      </GroupedInput>

      <Button
        onPress={handleLogin}
        disabled={!isFormValid}
        style={{
          marginTop: 24,
          backgroundColor: isFormValid
            ? colorScheme === "dark"
              ? "rgb(52, 199, 89)"
              : "rgb(48, 209, 88)"
            : "#ccc",
        }}
      >
        Login
      </Button>
    </View>
  );
}