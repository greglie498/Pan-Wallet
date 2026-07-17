import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { useWalletStore } from "@/lib/store";

type Provider = "MPESA" | "MTN_MOMO";

const PROVIDERS = [
  {
    id: "MPESA" as Provider,
    label: "M-Pesa",
    emoji: "📱",
    color: "bg-green-500",
    borderColor: "border-green-500",
    description: "Safaricom M-Pesa — Kenya",
    placeholder: "+254 7XX XXX XXX",
    hint: "Enter your M-Pesa registered number",
  },
  {
    id: "MTN_MOMO" as Provider,
    label: "MTN MoMo",
    emoji: "💛",
    color: "bg-yellow-500",
    borderColor: "border-yellow-500",
    description: "MTN Mobile Money — Uganda, Ghana, Rwanda & more",
    placeholder: "+256 7XX XXX XXX",
    hint: "Enter your MTN MoMo registered number",
  },
];

export default function LinkWalletScreen() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [walletNumber, setWalletNumber] = useState("");
  const [validationError, setValidationError] = useState("");

  const { linkWallet, isLoading, error, clearError } = useWalletStore();

  const selectedProviderInfo = PROVIDERS.find(
    (p) => p.id === selectedProvider
  );

  const validate = (): boolean => {
    if (!selectedProvider) {
      setValidationError("Please select a provider.");
      return false;
    }
    const cleaned = walletNumber.replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 15) {
      setValidationError("Enter a valid wallet number.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleLink = async () => {
    clearError();
    if (!validate() || !selectedProvider) return;

    try {
      await linkWallet(selectedProvider, walletNumber.trim());
      router.back();
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
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
          <View className="px-6 pt-4 pb-6 border-b border-gray-100">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mb-4"
            >
              <Text className="text-primary text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-primary text-2xl font-bold mb-1">
              Link a Wallet
            </Text>
            <Text className="text-muted text-sm">
              Connect your mobile money account to PanWallet
            </Text>
          </View>

          <View className="px-6 pt-6 flex-1">
            {/* Provider selection */}
            <Text className="text-primary font-semibold text-base mb-4">
              Select Provider
            </Text>

            {PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              return (
                <TouchableOpacity
                  key={provider.id}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 border-2 ${
                    isSelected
                      ? provider.borderColor + " bg-white"
                      : "border-gray-100 bg-white"
                  }`}
                  onPress={() => {
                    setSelectedProvider(provider.id);
                    setWalletNumber("");
                    clearError();
                    setValidationError("");
                  }}
                >
                  <View
                    className={`w-12 h-12 rounded-xl ${provider.color} items-center justify-center mr-4`}
                  >
                    <Text className="text-2xl">{provider.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary font-bold">
                      {provider.label}
                    </Text>
                    <Text className="text-muted text-xs">
                      {provider.description}
                    </Text>
                  </View>
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      isSelected ? "border-accent" : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <View className="w-3 h-3 rounded-full bg-accent" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Wallet number input */}
            {selectedProvider && (
              <View className="mt-6">
                <Input
                  label={`${selectedProviderInfo?.label} Number`}
                  placeholder={selectedProviderInfo?.placeholder}
                  keyboardType="phone-pad"
                  value={walletNumber}
                  onChangeText={(text) => {
                    setWalletNumber(text);
                    setValidationError("");
                  }}
                  hint={selectedProviderInfo?.hint}
                  error={validationError || error || undefined}
                />

                {/* Info box */}
                <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                  <Text className="text-blue-700 text-xs leading-5">
                    ℹ️ Make sure you enter the phone number registered with{" "}
                    {selectedProviderInfo?.label}. This number will be used
                    to send and receive money.
                  </Text>
                </View>

                <Button
                  title={`Link ${selectedProviderInfo?.label}`}
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleLink}
                  disabled={!walletNumber}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}