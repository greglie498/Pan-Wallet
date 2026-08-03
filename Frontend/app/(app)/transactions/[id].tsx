import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTransactionStore } from "@/lib/store/transaction.store";
import { useTheme } from "@/lib/store/theme.store";
import { Feather } from "@expo/vector-icons";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const { selectedTransaction, fetchTransactionById, isLoading } =
    useTransactionStore();

  useEffect(() => {
    if (id) {
      fetchTransactionById(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
        className="flex-1 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#F5A623" />
      </SafeAreaView>
    );
  }

  if (!selectedTransaction) {
    return (
      <SafeAreaView
        style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
        className="flex-1 px-6 pt-6"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Feather
            name="arrow-left"
            size={24}
            color={isDark ? "#FFF" : "#0F172A"}
          />
        </TouchableOpacity>
        <Text
          style={{ color: isDark ? "#FFF" : "#0F172A" }}
          className="text-lg font-bold"
        >
          Transaction not found
        </Text>
      </SafeAreaView>
    );
  }

  const isDeposit = selectedTransaction.type === "DEPOSIT";

  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />

      {/* Header */}
      <View
        style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
        className="px-6 py-4 flex-row items-center justify-between border-b"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <Feather
            name="arrow-left"
            size={20}
            color={isDark ? "#FFFFFF" : "#0F172A"}
          />
        </TouchableOpacity>

        <Text
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          className="text-lg font-bold"
        >
          Transaction Details
        </Text>

        <ThemeToggle />
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <Card variant="elevated" padding="lg" className="items-center mb-6">
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
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
          >
            <Feather
              name={isDeposit ? "arrow-down-left" : "arrow-up-right"}
              size={32}
              color={
                isDeposit
                  ? "#10B981"
                  : isDark
                  ? "#94A3B8"
                  : "#64748B"
              }
            />
          </View>

          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="text-3xl font-bold mb-2"
          >
            {isDeposit ? "+" : "-"}$
            {parseFloat(selectedTransaction.amount).toFixed(2)}
          </Text>

          <Badge
            label={selectedTransaction.status}
            variant={
              selectedTransaction.status === "COMPLETED"
                ? "success"
                : "warning"
            }
          />
        </Card>

        {/* Breakdown Card */}
        <Card variant="elevated" padding="lg">
          <View className="space-y-4">
            <View className="flex-row justify-between py-2 border-b border-slate-700/20">
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                Type
              </Text>
              <Text
                style={{ color: isDark ? "#FFF" : "#0F172A" }}
                className="font-semibold"
              >
                {selectedTransaction.type}
              </Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-slate-700/20">
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                Recipient
              </Text>
              <Text
                style={{ color: isDark ? "#FFF" : "#0F172A" }}
                className="font-semibold"
              >
                {selectedTransaction.recipientNumber || "N/A"}
              </Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-slate-700/20">
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                Transaction ID
              </Text>
              <Text
                style={{ color: isDark ? "#FFF" : "#0F172A" }}
                className="font-mono text-xs"
              >
                {selectedTransaction.id}
              </Text>
            </View>

            <View className="flex-row justify-between py-2">
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                Date
              </Text>
              <Text style={{ color: isDark ? "#FFF" : "#0F172A" }}>
                {new Date(selectedTransaction.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}