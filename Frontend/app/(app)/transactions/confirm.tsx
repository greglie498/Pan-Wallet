import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { transactionApi } from "@/lib/api";
import { useTheme } from "@/lib/store/theme.store";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ConfirmScreen() {
  const { isDark } = useTheme();

  const params = useLocalSearchParams<{
    senderWalletId: string;
    recipientProvider: string;
    recipientNumber: string;
    amount: string;
    convertedAmount: string;
    exchangeRate: string;
    fee: string;
    totalDeducted: string;
    senderCurrency: string;
    recipientCurrency: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);

  const providerLabel =
    {
      MPESA: "M-Pesa",
      MTN_MOMO: "MTN MoMo",
    }[params.recipientProvider ?? ""] ?? params.recipientProvider;

  const providerIcon =
    params.recipientProvider === "MPESA" ? (
      <MaterialCommunityIcons name="cellphone" size={24} color="#22C55E" />
    ) : (
      <MaterialCommunityIcons name="wallet" size={24} color="#EAB308" />
    );

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await transactionApi.initiateTransfer({
        senderWalletId: params.senderWalletId ?? "",
        recipientProvider: params.recipientProvider ?? "",
        recipientNumber: params.recipientNumber ?? "",
        amount: Number(params.amount),
        quotedExchangeRate: Number(params.exchangeRate),
        quotedConvertedAmount: Number(params.convertedAmount),
      });

      router.replace({
        pathname: "/(app)/transactions/success",
        params: {
          transactionId: result.transactionId,
          amount: params.amount,
          currency: params.senderCurrency,
          recipient: params.recipientNumber,
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Transfer Failed",
        error.response?.data?.message ??
          "Something went wrong. Please try again.",
        [{ text: "OK" }]
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
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-[#0A1628] px-6 pt-3 pb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-4"
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
            Confirm transfer
          </Text>

          <Text className="text-white text-3xl font-bold mt-0.5">
            Send Money
          </Text>

          <Text className="text-slate-400 text-sm mt-1">
            Review the details before sending
          </Text>
        </View>

        {/* Form Container */}
        <View
          style={{ backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }}
          className="px-6 pt-6 flex-1 rounded-t-[28px] -mt-4 shadow-sm"
        >
          {/* Recipient */}
          <View
            style={{
              backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
            className="rounded-2xl border p-5 mb-4"
          >
            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs uppercase font-medium tracking-wider mb-3"
            >
              Recipient
            </Text>

            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: isDark ? "#0F172A" : "#E2E8F0",
                }}
                className="w-12 h-12 rounded-xl items-center justify-center"
              >
                {providerIcon}
              </View>

              <View className="ml-4">
                <Text
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  className="text-lg font-bold"
                >
                  {params.recipientNumber}
                </Text>

                <Text
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  className="text-xs font-medium"
                >
                  via {providerLabel}
                </Text>
              </View>
            </View>
          </View>

          {/* Transfer breakdown */}
          <View
            style={{
              backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
            className="rounded-2xl border p-5 mb-4"
          >
            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs uppercase font-medium tracking-wider mb-4"
            >
              Payment Summary
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                You send
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-semibold text-sm"
              >
                {params.senderCurrency}{" "}
                {parseFloat(params.amount ?? "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
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
                1 {params.senderCurrency} ={" "}
                {parseFloat(params.exchangeRate ?? "0").toFixed(4)}{" "}
                {params.recipientCurrency}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
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
                {params.senderCurrency}{" "}
                {parseFloat(params.fee ?? "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View
              style={{ borderTopColor: isDark ? "#334155" : "#E2E8F0" }}
              className="border-t pt-3 my-1 flex-row justify-between"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="font-semibold text-sm"
              >
                Total deducted
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-bold text-base"
              >
                {params.senderCurrency}{" "}
                {parseFloat(params.totalDeducted ?? "0").toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 }
                )}
              </Text>
            </View>
          </View>

          {/* Recipient gets Hero Card */}
          <View className="bg-[#0A1628] rounded-2xl p-6 mb-6 items-center">
            <Text className="text-slate-400 text-xs uppercase tracking-wider font-medium">
              Recipient receives
            </Text>
            <Text className="text-[#F5A623] text-4xl font-bold mt-1">
              {params.recipientCurrency}{" "}
              {parseFloat(params.convertedAmount ?? "0").toLocaleString(
                "en-US",
                { minimumFractionDigits: 2 }
              )}
            </Text>

            <Text className="text-slate-400 text-xs mt-2">
              1 {params.senderCurrency} ={" "}
              {parseFloat(params.exchangeRate ?? "0").toFixed(4)}{" "}
              {params.recipientCurrency}
            </Text>
          </View>

          {/* Security Banner */}
          <View className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-2xl p-4 mb-6 flex-row items-center">
            <Feather name="shield" size={18} color="#F5A623" />
            <Text
              style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
              className="text-xs ml-3 flex-1 font-medium leading-4"
            >
              Your transfer is protected by PanWallet security. Review details
              carefully before confirming.
            </Text>
          </View>

          {/* Actions */}
          <Button
            title="Send Money Now"
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleConfirm}
          />

          <View className="mt-3 mb-8">
            <Button
              title="Cancel"
              variant="ghost"
              size="md"
              onPress={() => router.back()}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}