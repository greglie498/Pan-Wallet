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
import { useTheme } from "@/lib/store/theme.store";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

type Provider = "MPESA" | "MTN_MOMO";

const PROVIDERS = [
  {
    id: "MPESA" as Provider,
    label: "M-Pesa",
    icon: (
      <MaterialCommunityIcons name="cellphone" size={24} color="#FFFFFF" />
    ),
    color: "bg-green-600",
    borderColor: "border-green-500",
    description: "Safaricom M-Pesa — Kenya",
    placeholder: "+254 7XX XXX XXX",
    hint: "Enter your M-Pesa registered number",
  },
  {
    id: "MTN_MOMO" as Provider,
    label: "MTN MoMo",
    icon: <MaterialCommunityIcons name="wallet" size={24} color="#0A1628" />,
    color: "bg-yellow-500",
    borderColor: "border-yellow-500",
    description: "MTN Mobile Money — Uganda, Ghana, Rwanda & more",
    placeholder: "+256 7XX XXX XXX",
    hint: "Enter your MTN MoMo registered number",
  },
];

export default function LinkWalletScreen() {
  const { isDark } = useTheme();
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
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />
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
          <View
            style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
            className="px-6 pt-4 pb-6 border-b"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="w-10 h-10 rounded-full items-center justify-center mb-4"
              activeOpacity={0.8}
            >
              <Feather
                name="arrow-left"
                size={20}
                color={isDark ? "#FFFFFF" : "#0F172A"}
              />
            </TouchableOpacity>

            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="text-2xl font-bold mb-1"
            >
              Link a Wallet
            </Text>
            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs"
            >
              Connect your mobile money account to PanWallet
            </Text>
          </View>

          <View className="px-6 pt-6 flex-1">
            {/* Provider selection */}
            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="font-semibold text-base mb-4"
            >
              Select Provider
            </Text>

            {PROVIDERS.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              return (
                <TouchableOpacity
                  key={provider.id}
                  style={{
                    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                    borderColor: isSelected
                      ? "#F5A623"
                      : isDark
                      ? "#1E293B"
                      : "#E2E8F0",
                  }}
                  className="flex-row items-center p-4 rounded-2xl mb-3 border-2 shadow-sm"
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedProvider(provider.id);
                    setWalletNumber("");
                    clearError();
                    setValidationError("");
                  }}
                >
                  <View
                    className={`w-12 h-12 rounded-xl ${provider.color} items-center justify-center mr-4 shadow-sm`}
                  >
                    {provider.icon}
                  </View>

                  <View className="flex-1">
                    <Text
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                      className="font-bold text-base"
                    >
                      {provider.label}
                    </Text>
                    <Text
                      style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                      className="text-xs mt-0.5"
                    >
                      {provider.description}
                    </Text>
                  </View>

                  <View
                    style={{
                      borderColor: isSelected
                        ? "#F5A623"
                        : isDark
                        ? "#334155"
                        : "#CBD5E1",
                    }}
                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                  >
                    {isSelected && (
                      <View className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Wallet number input */}
            {selectedProvider && (
              <View className="mt-4">
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

                {/* Information Callout */}
                <View
                  style={{
                    backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
                    borderColor: isDark ? "#334155" : "#DBEAFE",
                  }}
                  className="flex-row items-start border rounded-xl p-4 my-6"
                >
                  <Feather
                    name="info"
                    size={16}
                    color="#3B82F6"
                    style={{ marginTop: 2 }}
                  />
                  <Text className="text-blue-500 text-xs leading-5 ml-3 flex-1 font-medium">
                    Make sure you enter the phone number registered with{" "}
                    {selectedProviderInfo?.label}. This number will be used to
                    send and receive money.
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