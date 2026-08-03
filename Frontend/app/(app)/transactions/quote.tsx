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
import { useTheme } from "@/lib/store/theme.store";
import { transactionApi, TransferQuote } from "@/lib/api";
import { getApiError } from "@/lib/api/error";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

type Provider = "MPESA" | "MTN_MOMO";

const PROVIDERS = [
  {
    id: "MPESA" as Provider,
    label: "M-Pesa",
    icon: <MaterialCommunityIcons name="cellphone" size={20} color="#22C55E" />,
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500",
  },
  {
    id: "MTN_MOMO" as Provider,
    label: "MTN MoMo",
    icon: <MaterialCommunityIcons name="wallet" size={20} color="#EAB308" />,
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500",
  },
];

export default function QuoteScreen() {
  const { isDark } = useTheme();
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
  
  const phoneRegex = /^(?:\+254|254|0)?(7\d{8})$/;

  const validate = (): boolean => {
    if (!recipientProvider) {
      setValidationError("Select a provider.");
      return false;
    }

    const cleanedNumber = recipientNumber.replace(/\s+/g, "");

    if (!phoneRegex.test(cleanedNumber)) {
      setValidationError("Enter a valid Kenyan phone number.");
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
        recipientNumber,
        amount: parseFloat(amount),
      });
      setQuote(result);
    } catch (err: unknown) {
      setError(getApiError(err));
    } finally {
      setIsLoadingQuote(false);
    }
  }, [recipientProvider, recipientNumber, amount, internalWallet]);

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
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
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
          <View className="bg-[#0A1628] px-6 pt-3 pb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-4"
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Send Money
            </Text>

            <Text className="text-white text-3xl font-bold mt-0.5">
              New Transfer
            </Text>

            <View className="mt-4 pt-4 border-t border-white/10 flex-row justify-between items-end">
              <View>
                <Text className="text-slate-400 text-xs">Available Balance</Text>
                <Text className="text-[#F5A623] text-2xl font-bold mt-0.5">
                  {internalWallet?.currency ?? "USD"}{" "}
                  {Number(internalWallet?.balance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Main Body */}
          <View
            style={{ backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }}
            className="px-6 pt-6 flex-1 rounded-t-[28px] -mt-4 shadow-sm"
          >
            {/* Provider selection */}
            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="font-bold text-sm mb-3"
            >
              Send to
            </Text>
            
            <View className="flex-row mb-6">
              {PROVIDERS.map((provider) => {
                const isSelected = recipientProvider === provider.id;
                return (
                  <TouchableOpacity
                    key={provider.id}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isDark
                        ? isSelected
                          ? "rgba(51, 65, 85, 0.8)"
                          : "rgba(30, 41, 59, 0.5)"
                        : isSelected
                        ? "#F8FAFC"
                        : "#FFFFFF",
                      borderColor: isSelected
                        ? "#F5A623"
                        : isDark
                        ? "#334155"
                        : "#E2E8F0",
                    }}
                    className="flex-1 flex-row items-center p-3.5 rounded-2xl border-2 mr-2 justify-between"
                    onPress={() => {
                      setRecipientProvider(provider.id);
                      setQuote(null);
                      setError("");
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-9 h-9 rounded-xl ${provider.bgColor} items-center justify-center mr-2.5`}
                      >
                        {provider.icon}
                      </View>
                      <Text
                        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                        className="font-semibold text-sm"
                      >
                        {provider.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check-circle" size={18} color="#F5A623" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recipient number */}
            <Input
              label="Recipient Number"
              placeholder="07XX XXX XXX"
              keyboardType="phone-pad"
              value={recipientNumber}
              onChangeText={(text) => {
                setRecipientNumber(text);
                setQuote(null);
                setValidationError("");
              }}
            />
            {validationError.includes("phone") && (
              <Text className="text-red-500 text-xs mt-1 mb-3">
                {validationError}
              </Text>
            )}

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

            {/* Get Quote Button */}
            <View className="mt-6 mb-4">
              <Button
                title="Get Quote"
                variant="primary"
                size="lg"
                loading={isLoadingQuote}
                onPress={handleGetQuote}
              />
            </View>

            {/* Validation error */}
            {validationError ? (
              <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <Text className="text-red-500 text-sm">{validationError}</Text>
              </View>
            ) : null}

            {/* API error */}
            {error ? (
              <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Loading Indicator */}
            {isLoadingQuote && (
              <View className="items-center py-8">
                <ActivityIndicator color="#F5A623" />
                <Text
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  className="text-sm mt-3"
                >
                  Fetching live exchange rate...
                </Text>
              </View>
            )}

            {/* Quote result */}
            {quote && !isLoadingQuote && (
              <View className="mt-2 mb-8">
                {/* Quote breakdown */}
                <View
                  style={{
                    backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                  }}
                  className="rounded-2xl border p-5 mb-4 items-center"
                >
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    className="font-bold text-base mb-4 self-start"
                  >
                    Transfer Summary
                  </Text>

                  <Text
                    style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                    className="text-xs uppercase tracking-wide mb-1"
                  >
                    You send
                  </Text>
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    className="font-bold text-xl mb-2"
                  >
                    {quote.senderCurrency}{" "}
                    {quote.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>

                  <Feather
                    name="arrow-down"
                    size={16}
                    color="#F5A623"
                    className="my-2"
                  />

                  <Text
                    style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                    className="text-xs uppercase tracking-wide mb-1"
                  >
                    Recipient Gets
                  </Text>
                  <Text className="text-[#F5A623] font-bold text-2xl mb-4">
                    {quote.recipientCurrency}{" "}
                    {quote.convertedAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>

                  <View
                    style={{
                      borderTopColor: isDark ? "#334155" : "#E2E8F0",
                    }}
                    className="w-full border-t pt-3 my-2"
                  >
                    <View className="w-full flex-row justify-between py-1">
                      <Text
                        style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                        className="text-sm"
                      >
                        Exchange rate
                      </Text>
                      <Text
                        style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
                        className="font-semibold text-sm"
                      >
                        1 {quote.senderCurrency} = {quote.exchangeRate.toFixed(2)}{" "}
                        {quote.recipientCurrency}
                      </Text>
                    </View>

                    <View className="w-full flex-row justify-between py-1">
                      <Text
                        style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                        className="text-sm"
                      >
                        Fee
                      </Text>
                      <Text
                        style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
                        className="font-semibold text-sm"
                      >
                        {quote.fee.toFixed(2)} {quote.senderCurrency}
                      </Text>
                    </View>

                    <View className="w-full flex-row justify-between py-1 mt-1">
                      <Text
                        style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                        className="text-sm font-semibold"
                      >
                        Total deducted
                      </Text>
                      <Text
                        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                        className="font-bold text-base"
                      >
                        {quote.totalDeducted.toFixed(2)} {quote.senderCurrency}
                      </Text>
                    </View>
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
                      title="Review Transfer →"
                      variant="primary"
                      size="md"
                      onPress={handleContinue}
                    />
                  </View>
                </View>

                <Text
                  style={{ color: isDark ? "#64748B" : "#94A3B8" }}
                  className="text-xs text-center mt-2"
                >
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