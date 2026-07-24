// app/(app)/topup.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card } from "@/components/ui";
import { useWalletStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { apiClient } from "@/lib/api";

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function TopUpScreen() {
  const { walletId } = useLocalSearchParams<{ walletId: string }>();
  const { wallets, fetchWallets, forceRefresh } = useWalletStore();
  const { isDark } = useTheme();

  const wallet = wallets.find((w) => w.id === walletId);

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = (): boolean => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      return false;
    }
    if (parsed > 10000) {
      setError("Maximum top-up is $10,000.");
      return false;
    }
    setError("");
    return true;
  };

  const handleTopUp = async () => {
    if (!validate() || !walletId) return;

    setIsLoading(true);
    try {
      await apiClient.post(`/wallets/${walletId}/topup`, {
        amount: parseFloat(amount),
      });

      // Refresh wallet data
      await fetchWallets();
      await forceRefresh();

      Alert.alert(
        "Top Up Successful! 🎉",
        `$${parseFloat(amount).toFixed(2)} has been added to your PanWallet balance.`,
        [
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Top up failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#111827" : "#F8FAFC"}
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
          <View className="px-6 pt-4 pb-6 border-b border-gray-100 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mb-4"
            >
              <Text className="text-primary dark:text-white text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-primary dark:text-white text-2xl font-bold mb-1">
              Top Up Wallet
            </Text>
            <Text className="text-muted dark:text-gray-400 text-sm">
              Add funds to your PanWallet balance
            </Text>
          </View>

          <View className="px-6 pt-6 flex-1">
            {/* Current balance */}
            <Card variant="elevated" padding="lg" className="mb-6">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-3">🌍</Text>
                <View>
                  <Text className="text-muted dark:text-gray-400 text-xs">
                    Current Balance
                  </Text>
                  <Text className="text-primary dark:text-white font-bold text-xl">
                    {wallet?.currency ?? "USD"}{" "}
                    {parseFloat(wallet?.balance ?? "0").toLocaleString(
                      "en-US",
                      { minimumFractionDigits: 2 }
                    )}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Quick amounts */}
            <Text className="text-primary dark:text-white font-semibold text-sm mb-3">
              Quick Select
            </Text>
            <View className="flex-row flex-wrap mb-6 -mx-1">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  className={`mx-1 mb-2 px-4 py-3 rounded-xl border-2 ${
                    amount === quickAmount.toString()
                      ? "border-accent bg-accent/10"
                      : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                  style={{ minWidth: "30%" }}
                  onPress={() => {
                    setAmount(quickAmount.toString());
                    setError("");
                  }}
                >
                  <Text
                    className={`text-center font-semibold text-sm ${
                      amount === quickAmount.toString()
                        ? "text-accent"
                        : "text-primary dark:text-white"
                    }`}
                  >
                    ${quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom amount input */}
            <Input
              label="Custom Amount (USD)"
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError("");
              }}
              error={error}
              leftIcon={
                <Text className="text-muted dark:text-gray-400 font-medium">
                  $
                </Text>
              }
            />

            {/* After top up preview */}
            {amount && parseFloat(amount) > 0 && (
              <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <Text className="text-green-700 dark:text-green-400 text-sm font-medium">
                  After top up your balance will be:
                </Text>
                <Text className="text-green-800 dark:text-green-300 text-xl font-bold mt-1">
                  {wallet?.currency ?? "USD"}{" "}
                  {(
                    parseFloat(wallet?.balance ?? "0") +
                    parseFloat(amount || "0")
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}

            {/* Sandbox notice */}
            <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6">
              <Text className="text-blue-700 dark:text-blue-400 text-xs leading-5">
                🧪 <Text className="font-bold">Sandbox Mode:</Text> This is a
                simulated top-up for testing purposes. No real money is
                transferred. Funds are added directly to your PanWallet balance.
              </Text>
            </View>

            <Button
              title={`Top Up ${amount ? `$${parseFloat(amount || "0").toFixed(2)}` : ""}`}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={!amount || parseFloat(amount) <= 0}
              onPress={handleTopUp}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}