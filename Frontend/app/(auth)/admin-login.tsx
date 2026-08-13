import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { Feather } from "@expo/vector-icons";
import AuthCard from "@/components/auth/AuthCard";

export default function AdminLoginScreen() {
  const { adminLogin, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const validate = (): boolean => {
    if (!username.trim()) {
      setValidationError("Enter your admin username.");
      return false;
    }
    if (!password) {
      setValidationError("Enter your password.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const submit = async () => {
    clearError();
    if (!validate()) return;
    await adminLogin(username.trim(), password);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mb-6"
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold mb-2">
              Admin Portal
            </Text>

            <Text className="text-gray-400 text-base leading-6">
              Sign in with your administrator credentials to manage PanWallet.
            </Text>
          </View>

          <View className="px-6">
            <AuthCard>
              <Text className="text-accent uppercase tracking-[3px] text-xs font-semibold mt-2 mb-4">
                RESTRICTED ACCESS
              </Text>

              <Input
                label="Username"
                placeholder="Enter your admin username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setValidationError("");
                  clearError();
                }}
                autoCapitalize="none"
                leftIcon={<Feather name="user" size={18} color="#94A3B8" />}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setValidationError("");
                  clearError();
                }}
                leftIcon={<Feather name="lock" size={18} color="#94A3B8" />}
                rightIcon={
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#94A3B8"
                  />
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {(validationError || error) && (
                <View className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4">
                  <Text className="text-red-400 text-sm">
                    {validationError || error}
                  </Text>
                </View>
              )}

              <Button
                title="Sign In"
                loading={isLoading}
                loadingText="Signing in..."
                onPress={submit}
              />
            </AuthCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}