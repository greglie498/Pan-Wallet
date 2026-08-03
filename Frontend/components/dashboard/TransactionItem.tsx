import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Badge } from "@/components/ui";
import { Transaction } from "@/lib/api";
import { useTheme } from "@/lib/store/theme.store";

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: Props) {
  const { isDark } = useTheme();

  const provider =
    {
      MPESA: "M-Pesa",
      MTN_MOMO: "MTN MoMo",
      PANWALLET_INTERNAL: "PanWallet",
    }[transaction.recipientProvider] ?? "Wallet";

  const icon =
    {
      MPESA: <MaterialCommunityIcons name="cellphone" size={18} color="#22C55E" />,
      MTN_MOMO: <MaterialCommunityIcons name="wallet" size={18} color="#EAB308" />,
      PANWALLET_INTERNAL: <Feather name="globe" size={18} color="#F5A623" />,
    }[transaction.recipientProvider] ?? <Feather name="send" size={18} color="#F5A623" />;

  const badgeVariant =
    {
      COMPLETED: "success",
      FAILED: "error",
      PENDING: "pending",
      REVERSED: "warning",
    }[transaction.status] as any;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/transactions/${transaction.id}`)}
      activeOpacity={0.7}
      className="py-3"
    >
      <View className="flex-row items-center">
        {/* Icon Circle */}
        <View
          style={{
            backgroundColor: isDark ? "rgba(51, 65, 85, 0.6)" : "#F1F5F9",
          }}
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
        >
          {icon}
        </View>

        {/* Transaction Info */}
        <View className="flex-1">
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-semibold text-sm"
          >
            Send Money
          </Text>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#475569" }}
            className="text-xs mt-0.5"
          >
            To {provider}
          </Text>
          <Text
            style={{ color: isDark ? "#64748B" : "#94A3B8" }}
            className="text-[10px] mt-0.5"
          >
            {new Date(transaction.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Amount & Status */}
        <View className="items-end">
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-bold text-sm"
          >
            - {transaction.currency}{" "}
            {Number(transaction.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
          <View className="mt-1">
            <Badge label={transaction.status} variant={badgeVariant} size="sm" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}