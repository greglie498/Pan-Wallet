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
import { Card, Badge, Button } from "@/components/ui";
import { transactionApi, Transaction } from "@/lib/api";

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const statusVariant = {
    COMPLETED: "success",
    FAILED: "error",
    PENDING: "pending",
    REVERSED: "warning",
  }[transaction.status] as "success" | "error" | "pending" | "warning";

  const providerInfo = {
    MPESA: { emoji: "📱", label: "M-Pesa" },
    MTN_MOMO: { emoji: "💛", label: "MTN MoMo" },
    PANWALLET_INTERNAL: { emoji: "🌍", label: "PanWallet" },
  }[transaction.recipientProvider] ?? { emoji: "💸", label: "Unknown" };

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(app)/transactions/${transaction.id}`)
      }
      className="mb-3"
    >
      <Card variant="default" padding="md">
        <View className="flex-row items-center">
          {/* Provider icon */}
          <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
            <Text className="text-2xl">{providerInfo.emoji}</Text>
          </View>

          {/* Details */}
          <View className="flex-1">
            <Text className="text-primary font-semibold text-sm mb-0.5">
              To {transaction.recipientNumber}
            </Text>
            <Text className="text-muted text-xs mb-1">
              via {providerInfo.label}
            </Text>
            <Text className="text-muted text-xs">{formattedDate}</Text>
          </View>

          {/* Amount + status */}
          <View className="items-end">
            <Text className="text-primary font-bold text-base mb-1">
              -{parseFloat(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>
            <Badge
              label={transaction.status}
              variant={statusVariant}
              size="sm"
            />
          </View>
        </View>

        {/* Exchange rate info if cross-currency */}
        {transaction.exchangeRate && (
          <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center">
            <Text className="text-muted text-xs">
              Rate: 1 {transaction.exchangeRate.sourceCurrency} ={" "}
              {parseFloat(transaction.exchangeRate.rate).toFixed(4)}{" "}
              {transaction.exchangeRate.targetCurrency}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    type FilterType = "ALL" | "COMPLETED" | "PENDING" | "FAILED";
    const [filter, setFilter] = useState<FilterType>("ALL");
    const loadTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await transactionApi.list();
            setTransactions(data);
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

  const filtered =
    filter === "ALL"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-100">
        <Text className="text-primary text-2xl font-bold mb-1">
          Transactions
        </Text>
        <Text className="text-muted text-sm">
          {transactions.length} total transaction
          {transactions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {(["ALL", "COMPLETED", "PENDING", "FAILED"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-full mr-2 ${
              filter === f ? "bg-primary" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filter === f ? "text-white" : "text-muted"
              }`}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F5A623"]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator color="#F5A623" className="mt-8" />
        ) : filtered.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">📋</Text>
            <Text className="text-primary font-bold text-lg mb-2">
              {filter === "ALL"
                ? "No transactions yet"
                : `No ${filter.toLowerCase()} transactions`}
            </Text>
            <Text className="text-muted text-sm text-center mb-8">
              {filter === "ALL"
                ? "Send money to see your transaction history here"
                : `You have no ${filter.toLowerCase()} transactions`}
            </Text>
            {filter === "ALL" && (
              <Button
                title="Send Money"
                variant="primary"
                size="md"
                fullWidth={false}
                onPress={() => router.push("/(app)/transactions/quote")}
              />
            )}
          </View>
        ) : (
          <View className="pb-8">
            {filtered.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}