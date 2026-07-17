// app/(app)/transactions/[id].tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui";
import { transactionApi, Transaction } from "@/lib/api";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await transactionApi.getById(id);
        setTransaction(data);
      } catch {
        setError("Failed to load transaction.");
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // Poll every 5 seconds if PENDING
    const interval = setInterval(async () => {
      if (transaction?.status === "PENDING") {
        try {
          if (!id) return;
          const data = await transactionApi.getById(id);
          setTransaction(data);
          if (data.status !== "PENDING") clearInterval(interval);
        } catch {
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const providerInfo = {
    MPESA: { emoji: "📱", label: "M-Pesa" },
    MTN_MOMO: { emoji: "💛", label: "MTN MoMo" },
    PANWALLET_INTERNAL: { emoji: "🌍", label: "PanWallet" },
  }[transaction?.recipientProvider ?? ""] ?? { emoji: "💸", label: "Unknown" };

    const statusVariant = (
        {
        COMPLETED: "success",
        FAILED: "error",
        PENDING: "pending",
        REVERSED: "warning",
        } as Record<string, "success" | "error" | "pending" | "warning">
    )[transaction?.status ?? "PENDING"] ?? "pending";
    
    const formattedDate = transaction
        ? new Date(transaction.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "";

    return (
        <SafeAreaView className="flex-1 bg-surface">
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        {/* Header */}
        <View className="px-6 pt-4 pb-4 border-b border-gray-100 flex-row items-center">
            <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center mr-4"
            >
            <Text className="text-primary text-2xl">←</Text>
            </TouchableOpacity>
            <Text className="text-primary text-lg font-bold">
            Transaction Details
            </Text>
        </View>

        {isLoading ? (
            <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#F5A623" />
            <Text className="text-muted text-sm mt-3">
                Loading transaction...
            </Text>
            </View>
        ) : error || !transaction ? (
            <View className="flex-1 items-center justify-center px-6">
            <Text className="text-5xl mb-4">❌</Text>
            <Text className="text-primary font-bold text-lg mb-2">
                Transaction not found
            </Text>
            <Text className="text-muted text-sm text-center">
                {error || "This transaction could not be loaded."}
            </Text>
            </View>
        ) : (
            <ScrollView className="flex-1 px-6 pt-6">
            {/* Status hero */}
            <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Text className="text-4xl">{providerInfo.emoji}</Text>
            </View>

            <Text className="text-primary text-3xl font-bold mb-2">
              -{parseFloat(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>

            <View className="mb-2">
              <Badge
                label={transaction.status}
                variant={statusVariant ?? "info"}
                size="md"
              />
            </View>

            {transaction.status === "PENDING" && (
              <View className="flex-row items-center mt-2">
                <ActivityIndicator
                  color="#F5A623"
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-muted text-xs">
                  Waiting for confirmation...
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-muted text-sm">Recipient</Text>
              <Text className="text-primary font-semibold text-sm">
                {transaction.recipientNumber}
              </Text>
            </View>

            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-muted text-sm">Provider</Text>
              <Text className="text-primary font-semibold text-sm">
                {providerInfo.label}
              </Text>
            </View>

            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-muted text-sm">Fee</Text>
              <Text className="text-primary font-semibold text-sm">
                {parseFloat(transaction.fee).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {transaction.exchangeRate && (
              <View className="flex-row justify-between py-3 border-b border-gray-50">
                <Text className="text-muted text-sm">Exchange rate</Text>
                <Text className="text-primary font-semibold text-sm">
                  1 {transaction.exchangeRate.sourceCurrency} ={" "}
                  {parseFloat(transaction.exchangeRate.rate).toFixed(4)}{" "}
                  {transaction.exchangeRate.targetCurrency}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between py-3 border-b border-gray-50">
              <Text className="text-muted text-sm">Date</Text>
              <Text className="text-primary font-semibold text-sm flex-1 text-right ml-4">
                {formattedDate}
              </Text>
            </View>

            <View className="flex-row justify-between py-3">
              <Text className="text-muted text-sm">Reference</Text>
              <Text
                className="text-primary font-semibold text-sm flex-1 text-right ml-4"
                numberOfLines={1}
              >
                {transaction.providerReferenceId ?? transaction.id}
              </Text>
            </View>
          </View>

          {/* Failure reason */}
          {transaction.failureReason && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <Text className="text-error font-semibold text-sm mb-1">
                Failure Reason
              </Text>
              <Text className="text-error text-sm">
                {transaction.failureReason}
              </Text>
            </View>
          )}

          <View className="mb-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}