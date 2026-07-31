import React from "react";
import {
  View,
  Text,
} from "react-native";
import { router } from "expo-router";
import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import QuickAction from "./QuickAction";

interface Props {
  walletId?: string;
}

export default function QuickActions({
  walletId,
}: Props) {
  return (
    <View className="mb-8">

      <Text className="text-primary dark:text-white text-xl font-bold mb-5">
        Quick Actions
      </Text>

      <View className="flex-row justify-between">

        <QuickAction
          label="Send"
          icon={
            <Feather
              name="send"
              size={24}
              color="#F5A623"
            />
          }
          onPress={() =>
            router.push("/(app)/transactions/quote")
          }
        />

        <QuickAction
          label="Top Up"
          icon={
            <Feather
              name="plus-circle"
              size={24}
              color="#F5A623"
            />
          }
          onPress={() =>
            router.push({
              pathname: "/(app)/topup",
              params: {
                walletId: walletId ?? "",
              },
            } as any)
          }
        />

        <QuickAction
          label="Wallets"
          icon={
            <MaterialCommunityIcons
              name="wallet-outline"
              size={24}
              color="#F5A623"
            />
          }
          onPress={() =>
            router.push("/(app)/wallets")
          }
        />

        <QuickAction
          label="History"
          icon={
            <Feather
              name="clock"
              size={24}
              color="#F5A623"
            />
          }
          onPress={() =>
            router.push("/(app)/transactions")
          }
        />

      </View>

    </View>
  );
}