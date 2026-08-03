import React, { useEffect, useState, useRef } from "react";
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
import { useTheme } from "@/lib/store/theme.store";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function TransactionDetailScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const statusRef = useRef<string | undefined>(undefined);
  statusRef.current = transaction?.status;

  useEffect(() => {
    let isMounted = true;

    const loadTransaction = async () => {
      try {
        if (!id) return;
        const data = await transactionApi.getById(id);
        if (isMounted) setTransaction(data);
      } catch {
        if (isMounted) setError("Failed to load transaction details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadTransaction();

    // Poll every 5 seconds if status is PENDING
    const interval = setInterval(async () => {
      if (statusRef.current === "PENDING" && id) {
        try {
          const updatedData = await transactionApi.getById(id);
          if (isMounted) {
            setTransaction(updatedData);
            if (updatedData.status !== "PENDING") {
              clearInterval(interval);
            }
          }
        } catch {
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);


  const providerInfoMap: Record<
    string,
    { icon: React.ReactNode; label: string }
  > = {
    MPESA: {
      icon: <MaterialCommunityIcons name="cellphone" size={32} color="#22C55E" />,
      label: "M-Pesa",
    },
    MTN_MOMO: {
      icon: <MaterialCommunityIcons name="wallet" size={32} color="#EAB308" />,
      label: "MTN MoMo",
    },
    PANWALLET_INTERNAL: {
      icon: <Feather name="globe" size={32} color="#F5A623" />,
      label: "PanWallet",
    },
  };

const providerInfo = providerInfoMap[
  transaction?.recipientProvider ?? ""
] ?? {
  icon: <Feather name="send" size={32} color="#94A3B8" />,
  label: "Unknown Provider",
};

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
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />

      {/* Header Bar */}
      <View
        style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
        className="px-6 py-4 border-b flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2 mr-2 rounded-full"
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={isDark ? "#FFFFFF" : "#0F172A"}
          />
        </TouchableOpacity>
        <Text
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          className="text-lg font-bold"
        >
          Transaction Details
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#F5A623" size="large" />
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-xs font-medium mt-4"
          >
            Loading transaction...
          </Text>
        </View>
      ) : error || !transaction ? (
        <View className="flex-1 items-center justify-center px-6">
          <View
            style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
          >
            <Feather name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-bold text-lg mb-1 text-center"
          >
            Transaction Not Found
          </Text>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-xs text-center"
          >
            {error || "This transaction could not be located."}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-6">
          {/* Status Hero Header */}
          <View className="items-center mb-6">
            <View
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
            >
              {providerInfo.icon}
            </View>

            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="text-3xl font-black mb-2"
            >
              -{parseFloat(transaction.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>

            <View className="mb-2">
              <Badge
                label={transaction.status}
                variant={statusVariant}
                size="md"
              />
            </View>

            {transaction.status === "PENDING" && (
              <View className="flex-row items-center mt-2">
                <ActivityIndicator
                  color="#F5A623"
                  size="small"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-[#F5A623] text-xs font-medium">
                  Updating status automatically...
                </Text>
              </View>
            )}
          </View>

          {/* Details Card */}
          <View
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
            className="rounded-2xl border p-5 mb-4 shadow-sm"
          >
            <View
              style={{ borderBottomColor: isDark ? "#334155" : "#F1F5F9" }}
              className="flex-row justify-between py-3 border-b"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                Recipient
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-bold text-sm"
              >
                {transaction.recipientNumber}
              </Text>
            </View>

            <View
              style={{ borderBottomColor: isDark ? "#334155" : "#F1F5F9" }}
              className="flex-row justify-between py-3 border-b"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                Provider
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-bold text-sm"
              >
                {providerInfo.label}
              </Text>
            </View>

            <View
              style={{ borderBottomColor: isDark ? "#334155" : "#F1F5F9" }}
              className="flex-row justify-between py-3 border-b"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                Fee
              </Text>
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="font-bold text-sm"
              >
                {parseFloat(transaction.fee).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>

            {transaction.exchangeRate && (
              <View
                style={{ borderBottomColor: isDark ? "#334155" : "#F1F5F9" }}
                className="flex-row justify-between py-3 border-b"
              >
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
                  1 {transaction.exchangeRate.sourceCurrency} ={" "}
                  {parseFloat(transaction.exchangeRate.rate).toFixed(4)}{" "}
                  {transaction.exchangeRate.targetCurrency}
                </Text>
              </View>
            )}

            <View
              style={{ borderBottomColor: isDark ? "#334155" : "#F1F5F9" }}
              className="flex-row justify-between py-3 border-b"
            >
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                Date
              </Text>
              <Text
                style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
                className="font-semibold text-sm flex-1 text-right ml-4"
              >
                {formattedDate}
              </Text>
            </View>

            <View className="flex-row justify-between py-3 items-center">
              <Text
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                className="text-sm"
              >
                Reference ID
              </Text>
              <Text
                style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
                className="font-mono text-xs font-semibold flex-1 text-right ml-4"
                numberOfLines={1}
              >
                {transaction.providerReferenceId ?? transaction.id}
              </Text>
            </View>
          </View>

          {/* Failure reason card */}
          {transaction.failureReason && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6 flex-row items-start">
              <Feather
                name="alert-circle"
                size={18}
                color="#EF4444"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <View className="flex-1">
                <Text className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
                  Failure Reason
                </Text>
                <Text className="text-red-400 text-xs leading-5 font-medium">
                  {transaction.failureReason}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}