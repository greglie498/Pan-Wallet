import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { router } from "expo-router";
import { Badge } from "@/components/ui";
import { Transaction } from "@/lib/api";

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({
  transaction,
}: Props) {

  const provider = {
    MPESA: "M-Pesa",
    MTN_MOMO: "MTN MoMo",
    PANWALLET_INTERNAL: "PanWallet",
  }[transaction.recipientProvider] ?? "Wallet";

  const icon = {
    MPESA: (
      <MaterialCommunityIcons
        name="cellphone"
        size={20}
        color="#22C55E"
      />
    ),

    MTN_MOMO: (
      <MaterialCommunityIcons
        name="wallet"
        size={20}
        color="#EAB308"
      />
    ),

    PANWALLET_INTERNAL: (
      <Feather
        name="globe"
        size={20}
        color="#F5A623"
      />
    ),
  }[transaction.recipientProvider];

  const badgeVariant = {
    COMPLETED: "success",
    FAILED: "error",
    PENDING: "pending",
    REVERSED: "warning",
  }[transaction.status] as any;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(app)/transactions/${transaction.id}`)
      }
      className="py-4"
    >
      <View className="flex-row">

        <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center mr-4">
          {icon}
        </View>

        <View className="flex-1">

          <Text className="text-primary dark:text-white font-bold">
            Send Money
          </Text>

          <Text className="text-slate-500 mt-1">
            To {provider}
          </Text>

          <Text className="text-slate-400 text-xs mt-1">
            {new Date(transaction.createdAt).toLocaleString()}
          </Text>

        </View>

        <View className="items-end">

          <Text className="text-primary dark:text-white font-bold text-lg">
            - {transaction.currency}{" "}
            {Number(transaction.amount).toLocaleString()}
          </Text>

          <View className="mt-2">
            <Badge
              label={transaction.status}
              variant={badgeVariant}
            />
          </View>

        </View>

      </View>

    </TouchableOpacity>
  );
}