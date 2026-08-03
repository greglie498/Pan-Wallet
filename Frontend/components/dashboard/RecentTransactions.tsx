import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/ui";
import { useTheme } from "@/lib/store/theme.store";
import TransactionItem from "./TransactionItem";

interface Props {
  loading: boolean;
  transactions: any[];
}

export default function RecentTransactions({ loading, transactions }: Props) {
  const { isDark } = useTheme();

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          className="text-lg font-bold"
        >
          Recent Transactions
        </Text>

        <TouchableOpacity onPress={() => router.push("/(app)/transactions")}>
          <Text className="text-[#F5A623] font-semibold text-sm">View All</Text>
        </TouchableOpacity>
      </View>

      <Card variant="default" padding="md">
        {loading ? (
          <ActivityIndicator color="#F5A623" className="py-6" />
        ) : transactions.length === 0 ? (
          <View className="items-center py-8">
            <Feather name="credit-card" size={32} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text
              style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
              className="font-semibold mt-3"
            >
              No transactions yet
            </Text>
            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs mt-1 text-center"
            >
              Your latest transfers will appear here.
            </Text>
          </View>
        ) : (
          transactions.map((transaction, index) => (
            <View key={transaction.id}>
              <TransactionItem transaction={transaction} />
              {index < transactions.length - 1 && (
                <View
                  style={{
                    backgroundColor: isDark ? "rgba(51, 65, 85, 0.5)" : "#F1F5F9",
                  }}
                  className="h-[1px] my-1"
                />
              )}
            </View>
          ))
        )}
      </Card>
    </View>
  );
}