import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { useWalletStore } from "@/lib/store";
import { transactionApi, TransferQuote } from "@/lib/api";

type Provider = "MPESA" | "MTN_MOMO";

const PROVIDERS = [
  {
    id: "MPESA" as Provider,
    label: "M-Pesa",
    emoji: "📱",
    color: "bg-green-500",
    borderColor: "border-green-500",
  },
  {
    id: "MTN_MOMO" as Provider,
    label: "MTN MoMo",
    emoji: "💛",
    color: "bg-yellow-500",
    borderColor: "border-yellow-500",
  },
];

export default function QuoteScreen() {
  const { wallets } = useWalletStore();
  const internalWallet = wallets.find(
    (w) => w.provider === "PANWALLET_INTERNAL"
  );

  const [recipientProvider, setRecipientProvider] =
    useState<Provider | null>(null);
  const [recipientNumber, setRecipientNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");

  const validate = (): boolean => {
    if (!recipientProvider) {
      setValidationError("Select a provider.");
      return false;
    }
    if (!recipientNumber || recipientNumber.replace(/\D/g, "").length < 10) {
      setValidationError("Enter a valid recipient number.");
      return false;
    }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setValidationError("Enter a valid amount.");
      return false;
    }
    if (!internalWallet) {
      setValidationError("No wallet found.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleGetQuote = useCallback(async () => {
    setError("");
    if (!validate() || !internalWallet || !recipientProvider) return;

    setIsLoadingQuote(true);
    setQuote(null);
    try {
      const result = await transactionApi.getQuote({
        senderWalletId: internalWallet.id,
        recipientProvider,
        amount: parseFloat(amount),
      });
      setQuote(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to get quote."
      );
    } finally {
      setIsLoadingQuote(false);
    }
  }, [recipientProvider, amount, internalWallet]);

  const handleContinue = () => {
    if (!quote || !recipientProvider) return;
    router.push({
      pathname: "/(app)/transactions/confirm",
      params: {
        senderWalletId: internalWallet?.id ?? "",
        recipientProvider,
        recipientNumber,
        amount,
        convertedAmount: quote.convertedAmount.toString(),
        exchangeRate: quote.exchangeRate.toString(),
        fee: quote.fee.toString(),
        totalDeducted: quote.totalDeducted.toString(),
        senderCurrency: quote.senderCurrency,
        recipientCurrency: quote.recipientCurrency,
      },
    });
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
              Send Money
            </Text>
            <Text className="text-muted text-sm">
              Available:{" "}
              <Text className="text-primary font-semibold">
                {internalWallet?.currency ?? "USD"}{" "}
                {parseFloat(internalWallet?.balance ?? "0").toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 }
                )}
              </Text>
            </Text>
          </View>

          <View className="px-6 pt-6 flex-1">
            {/* Provider selection */}
            <Text className="text-primary font-semibold text-sm mb-3">
              Send to
            </Text>
            <View className="flex-row mb-6">
              {PROVIDERS.map((provider) => {
                const isSelected = recipientProvider === provider.id;
                return (
                  <TouchableOpacity
                    key={provider.id}
                    className={`flex-1 flex-row items-center p-3 rounded-xl border-2 mr-2 ${
                      isSelected
                        ? provider.borderColor + " bg-white"
                        : "border-gray-100 bg-white"
                    }`}
                    onPress={() => {
                      setRecipientProvider(provider.id);
                      setQuote(null);
                      setError("");
                    }}
                  >
                    <View
                      className={`w-8 h-8 rounded-lg ${provider.color} items-center justify-center mr-2`}
                    >
                      <Text className="text-base">{provider.emoji}</Text>
                    </View>
                    <Text className="text-primary font-semibold text-sm">
                      {provider.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recipient number */}
            <Input
              label="Recipient Number"
              placeholder="+254 7XX XXX XXX"
              keyboardType="phone-pad"
              value={recipientNumber}
              onChangeText={(text) => {
                setRecipientNumber(text);
                setQuote(null);
                setValidationError("");
              }}
            />

            {/* Amount */}
            <Input
              label={`Amount (${internalWallet?.currency ?? "USD"})`}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setQuote(null);
                setValidationError("");
              }}
            />

            {/* Validation error */}
            {validationError ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-error text-sm">{validationError}</Text>
              </View>
            ) : null}

            {/* API error */}
            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Get Quote button */}
            {!quote && (
              <Button
                title="Get Quote"
                variant="secondary"
                size="lg"
                loading={isLoadingQuote}
                onPress={handleGetQuote}
              />
            )}

            {/* Quote result */}
            {isLoadingQuote && (
              <View className="items-center py-8">
                <ActivityIndicator color="#F5A623" />
                <Text className="text-muted text-sm mt-3">
                  Fetching live exchange rate...
                </Text>
              </View>
            )}

            {quote && !isLoadingQuote && (
              <View className="mt-2">
                {/* Quote breakdown */}
                <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                  <Text className="text-primary font-bold text-base mb-4">
                    Transfer Summary
                  </Text>

                  <View className="flex-row justify-between mb-3">
                    <Text className="text-muted text-sm">You send</Text>
                    <Text className="text-primary font-semibold">
                      {quote.senderCurrency}{" "}
                      {quote.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <Text className="text-muted text-sm">Exchange rate</Text>
                    <Text className="text-primary font-semibold">
                      1 {quote.senderCurrency} ={" "}
                      {quote.exchangeRate.toFixed(4)} {quote.recipientCurrency}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <Text className="text-muted text-sm">Fee</Text>
                    <Text className="text-primary font-semibold">
                      {quote.senderCurrency}{" "}
                      {quote.fee.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <View className="h-px bg-gray-100 my-3" />

                  <View className="flex-row justify-between mb-3">
                    <Text className="text-muted text-sm">Total deducted</Text>
                    <Text className="text-primary font-bold">
                      {quote.senderCurrency}{" "}
                      {quote.totalDeducted.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <View className="bg-accent/10 rounded-xl p-4">
                    <Text className="text-muted text-xs mb-1">
                      Recipient gets
                    </Text>
                    <Text className="text-primary text-2xl font-bold">
                      {quote.recipientCurrency}{" "}
                      {quote.convertedAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mb-2">
                  <Button
                    title="Refresh Quote"
                    variant="outline"
                    size="md"
                    loading={isLoadingQuote}
                    onPress={handleGetQuote}
                    fullWidth={false}
                    className="flex-1 mr-2"
                  />
                  <View className="flex-1 ml-2">
                    <Button
                      title="Continue"
                      variant="primary"
                      size="md"
                      onPress={handleContinue}
                    />
                  </View>
                </View>

                <Text className="text-muted text-xs text-center mt-2">
                  Rates are live and may change slightly at confirmation
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}