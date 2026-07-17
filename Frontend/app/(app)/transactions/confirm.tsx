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
import { transactionApi } from "@/lib/api";

export default function ConfirmScreen() {
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

  const providerLabel = {
    MPESA: "M-Pesa",
    MTN_MOMO: "MTN MoMo",
  }[params.recipientProvider ?? ""] ?? params.recipientProvider;

  const providerEmoji = {
    MPESA: "📱",
    MTN_MOMO: "💛",
  }[params.recipientProvider ?? ""] ?? "💸";

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await transactionApi.initiateTransfer({
        senderWalletId: params.senderWalletId ?? "",
        recipientProvider: params.recipientProvider ?? "",
        recipientNumber: params.recipientNumber ?? "",
        amount: parseFloat(params.amount ?? "0"),
        description: `PanWallet transfer to ${params.recipientNumber}`,
      });

      Alert.alert(
        "Transfer Initiated! 🎉",
        result.message,
        [
          {
            text: "View Transaction",
            onPress: () => {
              router.replace(
                `/(app)/transactions/${result.transactionId}`
              );
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: unknown) {
      Alert.alert(
        "Transfer Failed",
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mb-4"
          >
            <Text className="text-primary text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-primary text-2xl font-bold mb-1">
            Confirm Transfer
          </Text>
          <Text className="text-muted text-sm">
            Review the details before sending
          </Text>
        </View>

        <View className="px-6 pt-6">
          {/* Recipient */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <Text className="text-muted text-xs font-medium mb-3">
              SENDING TO
            </Text>
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
                <Text className="text-2xl">{providerEmoji}</Text>
              </View>
              <View>
                <Text className="text-primary font-bold text-base">
                  {params.recipientNumber}
                </Text>
                <Text className="text-muted text-sm">via {providerLabel}</Text>
              </View>
            </View>
          </View>

          {/* Transfer breakdown */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <Text className="text-muted text-xs font-medium mb-4">
              TRANSFER DETAILS
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-muted text-sm">You send</Text>
              <Text className="text-primary font-semibold">
                {params.senderCurrency}{" "}
                {parseFloat(params.amount ?? "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-muted text-sm">Exchange rate</Text>
              <Text className="text-primary font-semibold">
                1 {params.senderCurrency} ={" "}
                {parseFloat(params.exchangeRate ?? "0").toFixed(4)}{" "}
                {params.recipientCurrency}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-muted text-sm">Fee</Text>
              <Text className="text-primary font-semibold">
                {params.senderCurrency}{" "}
                {parseFloat(params.fee ?? "0").toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View className="h-px bg-gray-100 my-3" />

            <View className="flex-row justify-between">
              <Text className="text-primary font-bold">Total deducted</Text>
              <Text className="text-primary font-bold">
                {params.senderCurrency}{" "}
                {parseFloat(params.totalDeducted ?? "0").toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 2 }
                )}
              </Text>
            </View>
          </View>

          {/* Recipient gets */}
          <View className="bg-primary rounded-2xl p-5 mb-6">
            <Text className="text-gray-400 text-xs mb-1">
              Recipient gets
            </Text>
            <Text className="text-white text-3xl font-bold">
              {params.recipientCurrency}{" "}
              {parseFloat(params.convertedAmount ?? "0").toLocaleString(
                "en-US",
                { minimumFractionDigits: 2 }
              )}
            </Text>
          </View>

          {/* Warning */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <Text className="text-yellow-800 text-xs leading-5">
              ⚠️ By confirming, you authorise PanWallet to debit{" "}
              {params.senderCurrency}{" "}
              {parseFloat(params.totalDeducted ?? "0").toFixed(2)} from your
              wallet. This action cannot be undone.
            </Text>
          </View>

          {/* Buttons */}
          <Button
            title="Confirm & Send"
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