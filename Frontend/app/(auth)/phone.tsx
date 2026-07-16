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

export default function PhoneScreen() {
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]!);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { loginWithFirebase, isLoading, error, clearError } = useAuthStore();

  const validatePhone = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length < 9 || cleaned.length > 10) {
      setValidationError("Enter a valid phone number.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleContinue = async () => {
    clearError();
    if (!validatePhone(phoneNumber)) return;

    const fullNumber = `${selectedCode.code}${phoneNumber.replace(/\D/g, "")}`;
    await loginWithFirebase(fullNumber);
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
          <View className="px-6 pt-4 pb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mb-8"
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>

            <Text className="text-white text-3xl font-bold mb-2">
              Enter your{"\n"}phone number
            </Text>
            <Text className="text-gray-400 text-sm">
              We'll send you a verification code
            </Text>
          </View>

          {/* Phone input */}
          <View className="px-6 flex-1">
            {/* Country code picker */}
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

            {/* Country list dropdown */}
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
                    <Text className="text-white">
                      {country.country}
                    </Text>
                    <Text className="text-gray-400 ml-auto">
                      {country.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Phone number field */}
            <Input
              label="Phone Number"
              placeholder="7XX XXX XXX"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (validationError) setValidationError("");
              }}
              error={validationError || error || undefined}
              leftIcon={
                <Text className="text-gray-400 font-medium">
                  {selectedCode.code}
                </Text>
              }
              maxLength={10}
            />

            <Text className="text-gray-500 text-xs mb-8">
              Standard SMS rates may apply
            </Text>

            <Button
              title="Send Verification Code"
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleContinue}
              disabled={phoneNumber.length < 9}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}