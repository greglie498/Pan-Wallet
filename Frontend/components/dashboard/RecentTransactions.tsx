import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { router } from "expo-router";

import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/ui";

import TransactionItem from "./TransactionItem";

interface Props {
  loading: boolean;
  transactions: any[];
}

export default function RecentTransactions({
  loading,
  transactions,
}: Props) {
  return (
    <View className="mb-8">

      <View className="flex-row justify-between items-center mb-4">

        <Text className="text-primary dark:text-white text-xl font-bold">
          Recent Transactions
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push("/(app)/transactions")
          }
        >
          <Text className="text-accent">
            View All
          </Text>
        </TouchableOpacity>

      </View>

      <Card
        variant="default"
        padding="md"
      >
        {loading ? (
          <ActivityIndicator color="#F5A623" />
        ) : transactions.length === 0 ? (
          <View className="items-center py-10">

            <Feather
              name="credit-card"
              size={36}
              color="#94A3B8"
            />

            <Text className="text-primary dark:text-white font-semibold mt-4">
              No transactions yet
            </Text>

            <Text className="text-slate-500 mt-2 text-center">
              Your latest transfers will appear here.
            </Text>

          </View>
        ) : (
          transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
            />
          ))
        )}
      </Card>

    </View>
  );
}