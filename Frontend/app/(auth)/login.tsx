import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { Feather } from "@expo/vector-icons";
import PhoneInput from "@/components/auth/PhoneInput";
import AuthCard from "@/components/auth/AuthCard";
import AuthFooter from "@/components/auth/AuthFooter";

const COUNTRY_CODES = [
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+250", flag: "🇷🇼", country: "Rwanda" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
];

type Mode = "login" | "register" | "admin";

export default function LoginScreen() {
  const mode: Mode = "login";
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]!);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { loginWithPassword, error, clearError } = useAuthStore();

  const validate = (): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.length < 9) {
      setValidationError("Enter a valid phone number.");
      return false;
    }

    if (!password) {
      setValidationError("Enter your password.");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = async () => {
    clearError();

    if (!validate()) return;

    const fullNumber = `${selectedCode.code}${phoneNumber.replace(/\D/g, "")}`;

    await loginWithPassword(fullNumber, password);
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
          keyboardShouldPersistTaps="always"
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Image
              source={require("@/assets/images/panwallet-logo-dark.png")}
              className="w-24 h-24 self-center mb-6"
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mb-6"
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold mb-2">
              Welcome Back
            </Text>

            <Text className="text-gray-400 text-base leading-6">
              Sign in to continue to your PanWallet account.
            </Text>
          </View>

          <View className="px-6">
            <AuthCard>
              <Text className="text-accent uppercase tracking-[3px] text-xs font-semibold mt-2">
                ONE WALLET. EVERY NETWORK.
              </Text>
              <View>
                <PhoneInput
                  selectedCountry={selectedCode}
                  onCountryChange={setSelectedCode}
                  phoneNumber={phoneNumber}
                  onPhoneChange={(text) => {
                    setPhoneNumber(text);
                    setValidationError("");
                  }}
                  leftIcon={
                    <Feather name="phone" size={18} color="#94A3B8" />
                  }
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  rightIcon={
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#94A3B8"
                    />
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  leftIcon={
                    <Feather name="lock" size={18} color="#94A3B8" />
                  }
                />
              </View>

              <View className="items-end mb-6">
                <TouchableOpacity>
                  <Text className="text-accent font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error */}
              {(validationError || error) && (
                <View className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4">
                  <Text className="text-red-400 text-sm">
                    {validationError || error}
                  </Text>
                </View>
              )}

              <Button title="Sign In" onPress={handleSubmit} />

              <AuthFooter
                text="Don't have an account?"
                action="Create Account"
                onPress={() => router.replace("/(auth)/register")}
              />

              <Text className="text-gray-500 text-xs text-center mt-6">
                By continuing, you agree to our Terms of Service{"\n"}
                and Privacy Policy
              </Text>
            </AuthCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}