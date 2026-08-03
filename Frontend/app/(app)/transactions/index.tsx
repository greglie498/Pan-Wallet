import React, { useEffect, useState } from "react";
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
import { Card, Badge, ThemeToggle } from "@/components/ui";
import { useTransactionStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { Transaction } from "@/lib/api/transaction.api";
import { Feather } from "@expo/vector-icons";

function TransactionCard({
  transaction,
  onPress,
}: {
  transaction: Transaction;
  onPress: () => void;
}) {
  const { isDark } = useTheme();

  const isDeposit = transaction.type === "DEPOSIT";
  const statusVariant =
    transaction.status === "COMPLETED"
      ? "success"
      : transaction.status === "PENDING"
      ? "warning"
      : "error";

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="md" className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View
              style={{
                backgroundColor: isDeposit
                  ? isDark
                    ? "#064E3B"
                    : "#DCFCE7"
                  : isDark
                  ? "#1E293B"
                  : "#F1F5F9",
              }}
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
            >
              <Feather
                name={isDeposit ? "arrow-down-left" : "arrow-up-right"}
                size={18}
                color={
                  isDeposit
                    ? "#10B981"
                    : isDark
                    ? "#94A3B8"
                    : "#64748B"
                }
              />
            </View>

            <View className="flex-1">
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-bold text-sm"
                numberOfLines={1}
              >
                {isDeposit
                  ? "Top Up / Deposit"
                  : transaction.recipientNumber || "Transfer"}
              </Text>
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-xs mt-0.5"
              >
                {formattedDate}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text
              style={{
                color: isDeposit
                  ? "#10B981"
                  : isDark
                  ? "#FFFFFF"
                  : "#0F172A",
              }}
              className="font-bold text-sm mb-1"
            >
              {isDeposit ? "+" : "-"}${parseFloat(transaction.amount).toFixed(2)}
            </Text>
            <Badge label={transaction.status} variant={statusVariant} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const { isDark } = useTheme();
  const { transactions, isLoading, fetchTransactions } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
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

      {/* Header with ThemeToggle */}
      <View
        style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
        className="px-6 py-4 flex-row items-center justify-between border-b"
      >
        <View>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="text-2xl font-bold"
          >
            Transactions
          </Text>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-xs mt-0.5"
          >
            {transactions.length} total transaction
            {transactions.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <ThemeToggle />
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
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
        {isLoading && !refreshing ? (
          <ActivityIndicator color="#F5A623" size="large" className="mt-12" />
        ) : transactions.length === 0 ? (
          <View className="items-center py-16">
            <View
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
            >
              <Feather
                name="clock"
                size={28}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </View>

            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="font-bold text-lg mb-1"
            >
              No transactions yet
            </Text>

            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs text-center leading-5"
            >
              Your transaction history will appear here once you send or receive money.
            </Text>
          </View>
        ) : (
          <View className="pb-8">
            {transactions.map((tx: Transaction) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                onPress={() => router.push(`/(app)/transactions/${tx.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}