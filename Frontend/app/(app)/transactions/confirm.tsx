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
      amount: Number(params.amount),

      quotedExchangeRate: Number(params.exchangeRate),
      quotedConvertedAmount: Number(params.convertedAmount)
    });

      router.replace({
        pathname:"/(app)/transactions/success",
        params:{
          transactionId: result.transactionId,
          amount: params.amount,
          currency: params.senderCurrency,
          recipient: params.recipientNumber,
        }
      });
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
        <View className="bg-primary px-6 pt-5 pb-10">

          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full bg-white/10 items-center justify-center mb-6"
          >
            <Text className="text-white text-xl">
              ←
            </Text>
          </TouchableOpacity>

          <Text className="text-slate-400 text-sm">
            Confirm transfer
          </Text>

          <Text className="text-white text-3xl font-black mt-1">
            Send Money
          </Text>


          <Text className="text-muted text-sm">
            Review the details before sending
          </Text>
        </View>

        <View className="px-6 pt-6">
          {/* Recipient */}
          <View className="bg-white rounded-3xl p-5 mb-4">

              <Text className="text-slate-400 text-xs uppercase mb-4">
              Recipient
              </Text>

            <View className="flex-row items-center">

              <View className="w-14 h-14 rounded-2xl bg-slate-100 items-center justify-center">

                <Text className="text-3xl">
                  {providerEmoji}
                </Text>

              </View>

              <View className="ml-4">

                <Text className="text-primary text-lg font-bold">
                  {params.recipientNumber}
                </Text>

                <Text className="text-muted">
                  via {providerLabel}
                </Text>

              </View>
          </View>

          </View>

          {/* Transfer breakdown */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <Text className="text-slate-400 text-xs uppercase mb-5">
              PAYMENT SUMMARY
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
          <View className="bg-primary rounded-3xl p-6 mb-6 items-center">


              <Text className="text-slate-400 text-sm">
                Recipient receives
              </Text>
              <Text className="text-accent text-4xl font-black mt-2">

                {params.recipientCurrency}{" "}
                {parseFloat(params.convertedAmount ?? "0")
                  .toLocaleString(
                    "en-US",
                    {
                    minimumFractionDigits:2
                    }
                )}

              </Text>

              <Text className="text-slate-400 mt-3">

                1 {params.senderCurrency}
                {" = "}
                {parseFloat(params.exchangeRate ?? "0")
                  .toFixed(4)}
                {" "}
                {params.recipientCurrency}

              </Text>
            </View>

          {/* Warning */}
          <View className="bg-accent/10 rounded-2xl p-4 mb-6">
            <Text className="text-primary text-sm leading-5">
              🔒 Your transfer is protected by PanWallet security.
              Review the details carefully before confirming.
            </Text>

          </View>

          {/* Buttons */}
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