// app/(app)/admin/transactions.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge } from "@/components/ui";
import { useTheme } from "@/lib/store/theme.store";
import { adminApi, AdminTransaction } from "@/lib/api/admin.api";

export default function AdminTransactionsScreen() {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await adminApi.getTransactions(1, 50);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch {
      // fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const providerEmoji = (provider: string) =>
    ({ MPESA: "📱", MTN_MOMO: "💛", PANWALLET_INTERNAL: "🌍" }[
      provider
    ] ?? "💸");

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#111827" : "#F8FAFC"}
      />

      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <Text className="text-primary dark:text-white text-2xl">←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-primary dark:text-white text-xl font-bold">
            All Transactions
          </Text>
          <Text className="text-muted dark:text-gray-400 text-xs">
            {total} total
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F5A623"]}
            tintColor="#F5A623"
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#F5A623" className="mt-8" />
        ) : (
          transactions.map((tx) => {
            const statusVariant = (
              {
                COMPLETED: "success",
                FAILED: "error",
                PENDING: "pending",
                REVERSED: "warning",
              } as Record<string, "success" | "error" | "pending" | "warning">
            )[tx.status] ?? "pending";

            return (
              <Card
                key={tx.id}
                variant="default"
                padding="md"
                className="mb-3"
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3">
                    <Text className="text-xl">
                      {providerEmoji(tx.recipientProvider)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary dark:text-white font-bold text-sm">
                      {tx.senderWallet.user.name}
                    </Text>
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      {tx.senderWallet.user.phoneNumber}
                    </Text>
                  </View>
                  <Badge
                    label={tx.status}
                    variant={statusVariant}
                    size="sm"
                  />
                </View>

                <View className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      To
                    </Text>
                    <Text className="text-primary dark:text-white text-xs font-medium">
                      {tx.recipientNumber}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      Amount
                    </Text>
                    <Text className="text-primary dark:text-white text-xs font-bold">
                      ${parseFloat(tx.amount).toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      Date
                    </Text>
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}
        <View className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}