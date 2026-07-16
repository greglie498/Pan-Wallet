// app/(auth)/phone.tsx

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

const COUNTRY_CODES = [
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+250", flag: "🇷🇼", country: "Rwanda" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
];

type Mode = "login" | "register";

export default function PhoneScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]!);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { loginWithPassword, registerWithPassword, isLoading, error, clearError } =
    useAuthStore();

  const validate = (): boolean => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setValidationError("Enter a valid phone number.");
      return false;
    }
    if (mode === "register") {
      if (name.trim().length < 2) {
        setValidationError("Enter your full name.");
        return false;
      }
      if (password.length < 8) {
        setValidationError("Password must be at least 8 characters.");
        return false;
      }
      if (password !== confirmPassword) {
        setValidationError("Passwords do not match.");
        return false;
      }
    } else {
      if (!password) {
        setValidationError("Enter your password.");
        return false;
      }
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = async () => {
    clearError();
    if (!validate()) return;

    const fullNumber = `${selectedCode.code}${phoneNumber.replace(/\D/g, "")}`;

    if (mode === "register") {
      await registerWithPassword(fullNumber, name.trim(), password);
    } else {
      await loginWithPassword(fullNumber, password);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
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
              {mode === "login" ? "Welcome\nback" : "Create your\naccount"}
            </Text>
            <Text className="text-gray-400 text-sm">
              {mode === "login"
                ? "Sign in to your PanWallet account"
                : "Start sending money across Africa"}
            </Text>
          </View>

          {/* Mode toggle */}
          <View className="flex-row mx-6 mb-6 bg-primary-light rounded-xl p-1">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${
                mode === "login" ? "bg-accent" : ""
              }`}
              onPress={() => { setMode("login"); clearError(); setValidationError(""); }}
            >
              <Text
                className={`font-semibold text-sm ${
                  mode === "login" ? "text-primary" : "text-gray-400"
                }`}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-lg items-center ${
                mode === "register" ? "bg-accent" : ""
              }`}
              onPress={() => { setMode("register"); clearError(); setValidationError(""); }}
            >
              <Text
                className={`font-semibold text-sm ${
                  mode === "register" ? "text-primary" : "text-gray-400"
                }`}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 flex-1">
            {/* Name field — register only */}
            {mode === "register" && (
              <Input
                label="Full Name"
                placeholder="Jane Wanjiru"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            {/* Country picker */}
            <Text className="text-gray-300 text-sm font-medium mb-2">
              Country
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-primary-light border-2 border-gray-700 rounded-xl px-4 h-14 mb-4"
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text className="text-xl mr-3">{selectedCode.flag}</Text>
              <Text className="text-white font-medium flex-1">
                {selectedCode.country} ({selectedCode.code})
              </Text>
              <Text className="text-gray-400">
                {showCountryPicker ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {showCountryPicker && (
              <View className="bg-primary-light border-2 border-gray-700 rounded-xl mb-4 overflow-hidden">
                {COUNTRY_CODES.map((country) => (
                  <TouchableOpacity
                    key={country.code}
                    className="flex-row items-center px-4 py-3 border-b border-gray-700"
                    onPress={() => {
                      setSelectedCode(country);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text className="text-xl mr-3">{country.flag}</Text>
                    <Text className="text-white">{country.country}</Text>
                    <Text className="text-gray-400 ml-auto">
                      {country.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Phone number */}
            <Input
              label="Phone Number"
              placeholder="7XX XXX XXX"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setValidationError("");
              }}
              leftIcon={
                <Text className="text-gray-400 font-medium">
                  {selectedCode.code}
                </Text>
              }
              maxLength={10}
            />

            {/* Password */}
            <Input
              label="Password"
              placeholder="Min. 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Confirm password — register only */}
            {mode === "register" && (
              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            )}

            {/* Error */}
            {(validationError || error) && (
              <View className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-sm">
                  {validationError || error}
                </Text>
              </View>
            )}

            <Button
              title={mode === "login" ? "Sign In" : "Create Account"}
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleSubmit}
            />

            <Text className="text-gray-500 text-xs text-center mt-6">
              By continuing, you agree to our Terms of Service{"\n"}
              and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}