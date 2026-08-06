import React, { useState, useEffect } from "react";
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
import { Button, Input, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useWalletStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { transactionApi } from "@/lib/api/transaction.api";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Match the backend interface exact type
export interface TransferQuote {
  senderWalletId: string;
  senderCurrency: string;
  recipientProvider: string;
  recipientNumber: string;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  fee: number;
  totalDeducted: number;
  recipientCurrency: string;
}

type Provider = "MPESA" | "MTN_MOMO";

const PROVIDERS = [
  {
    id: "MPESA" as Provider,
    label: "M-Pesa",
    icon: <MaterialCommunityIcons name="cellphone" size={20} color="#FFFFFF" />,
    color: "bg-green-600",
  },
  {
    id: "MTN_MOMO" as Provider,
    label: "MTN MoMo",
    icon: <MaterialCommunityIcons name="wallet" size={20} color="#0A1628" />,
    color: "bg-yellow-500",
  },
];

export default function QuoteScreen() {
  const { isDark } = useTheme();
  const { wallets, fetchWallets } = useWalletStore();

  const [selectedProvider, setSelectedProvider] = useState<Provider>("MPESA");
  const [recipientNumber, setRecipientNumber] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [step, setStep] = useState<"INPUT" | "QUOTE">("INPUT");

  const [activeQuote, setActiveQuote] = useState<TransferQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  // Primary linked wallet to execute transfer from
  const activeWallet = wallets[0];
  const availableBalance = wallets.reduce(
    (acc, wallet) => acc + parseFloat(wallet.balance || "0"),
    0
  );

  const handleGetQuote = async () => {
    setError(null);
    const numericAmount = parseFloat(amountUsd);

    if (!activeWallet) {
      setError("No active wallet found. Please link or create a wallet first.");
      return;
    }
420987
    if (!recipientNumber.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid recipient number and amount.");
      return;
    }

    setIsLoading(true);
    try {
      const quote: TransferQuote = await transactionApi.getQuote({
        senderWalletId: activeWallet.id,
        recipientProvider: selectedProvider,
        recipientNumber: recipientNumber.trim(),
        amount: numericAmount,
      });

      setActiveQuote(quote);
      setStep("QUOTE");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to create quote."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!activeQuote || !activeWallet) return;

    setIsLoading(true);
    setError(null);

    try {
      await transactionApi.initiateTransfer({
        senderWalletId: activeWallet.id,
        recipientProvider: selectedProvider,
        recipientNumber: recipientNumber.trim(),
        amount: parseFloat(amountUsd),
      });

      router.replace("/(app)/transactions");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Transfer execution failed."
      );
    } finally {
      setIsLoading(false);
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
          {/* Top Navigation */}
          <View
            style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
            className="px-6 pt-4 pb-6 border-b flex-row items-center justify-between"
          >
            <TouchableOpacity
              onPress={() => {
                if (step === "QUOTE") {
                  setStep("INPUT");
                  setError(null);
                } else {
                  router.back();
                }
              }}
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="w-10 h-10 rounded-full items-center justify-center"
              activeOpacity={0.8}
            >
              <Feather
                name="arrow-left"
                size={20}
                color={isDark ? "#FFFFFF" : "#0F172A"}
              />
            </TouchableOpacity>

            <View className="items-center">
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-xs font-semibold uppercase tracking-wider"
              >
                Send Money
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-xl font-bold"
              >
                {step === "INPUT" ? "New Transfer" : "Confirm Transfer"}
              </Text>
            </View>

            <ThemeToggle />
          </View>

          <View className="px-6 pt-6 flex-1">
            {/* Wallet Balance Card */}
            <View
              style={{
                backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                borderColor: isDark ? "#334155" : "#E2E8F0",
              }}
              className="p-4 rounded-2xl border mb-6 flex-row justify-between items-center"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-xs font-medium"
              >
                Available Balance
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-lg font-bold"
              >
                USD {availableBalance.toFixed(2)}
              </Text>
            </View>

            {step === "INPUT" ? (
              <>
                {/* Provider Selection */}
                <Text
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  className="text-xs font-semibold mb-3 uppercase"
                >
                  Provider
                </Text>

                <View className="flex-row space-x-3 mb-6">
                  {PROVIDERS.map((provider) => {
                    const isSelected = selectedProvider === provider.id;
                    return (
                      <TouchableOpacity
                        key={provider.id}
                        onPress={() => setSelectedProvider(provider.id)}
                        style={{
                          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                          borderColor: isSelected
                            ? "#F5A623"
                            : isDark
                            ? "#1E293B"
                            : "#E2E8F0",
                        }}
                        className="flex-1 flex-row items-center p-3 rounded-xl border-2"
                        activeOpacity={0.8}
                      >
                        <View
                          className={`w-8 h-8 rounded-lg ${provider.color} items-center justify-center mr-2`}
                        >
                          {provider.icon}
                        </View>
                        <Text
                          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                          className="font-bold text-xs flex-1"
                        >
                          {provider.label}
                        </Text>
                        {isSelected && (
                          <Feather
                            name="check-circle"
                            size={16}
                            color="#F5A623"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Input
                  label="Recipient Number"
                  placeholder="+254 7XX XXX XXX"
                  keyboardType="phone-pad"
                  value={recipientNumber}
                  onChangeText={(text) => {
                    setRecipientNumber(text);
                    if (error) setError(null);
                  }}
                />

                <Input
                  label="Amount (USD)"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amountUsd}
                  onChangeText={(text) => {
                    setAmountUsd(text);
                    if (error) setError(null);
                  }}
                  error={error || undefined}
                />

                <Button
                  title="Get Quote"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleGetQuote}
                  disabled={!recipientNumber || !amountUsd || isLoading}
                  style={{ marginTop: 20 }}
                />
              </>
            ) : (
              /* Step 2: Quote Breakdown */
              <Card variant="elevated" padding="lg" className="mb-6">
                <Text
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  className="text-xs font-semibold mb-4 uppercase"
                >
                  Transfer Summary
                </Text>

                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      You Send
                    </Text>
                    <Text
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                      className="font-bold"
                    >
                      {activeQuote?.senderCurrency} {activeQuote?.amount}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      Recipient Gets
                    </Text>
                    <Text className="font-bold text-green-500">
                      {activeQuote?.recipientCurrency}{" "}
                      {activeQuote?.convertedAmount}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      Exchange Rate
                    </Text>
                    <Text style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>
                      1 {activeQuote?.senderCurrency} ={" "}
                      {activeQuote?.exchangeRate}{" "}
                      {activeQuote?.recipientCurrency}
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                      Transfer Fee
                    </Text>
                    <Text style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>
                      {activeQuote?.senderCurrency} {activeQuote?.fee}
                    </Text>
                  </View>

                  <View className="flex-row justify-between pt-3 border-t border-slate-700/20">
                    <Text
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                      className="font-bold"
                    >
                      Total Deducted
                    </Text>
                    <Text className="font-bold text-[#F5A623]">
                      {activeQuote?.senderCurrency} {activeQuote?.totalDeducted}
                    </Text>
                  </View>
                </View>

                {error && (
                  <Text className="text-red-500 text-xs mt-3">{error}</Text>
                )}

                <Button
                  title="Confirm & Send"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  onPress={handleTransfer}
                  disabled={isLoading}
                  style={{ marginTop: 24 }}
                />
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}