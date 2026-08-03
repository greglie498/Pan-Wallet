import React from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/lib/store/theme.store";
import QuickAction from "./QuickAction";

interface Props {
  walletId?: string;
}

export default function QuickActions({ walletId }: Props) {
  const { isDark } = useTheme();

  return (
    <View className="mb-8">
      {/* Explicit style prevents NativeWind dark: class lock */}
      <Text
        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
        className="text-lg font-bold mb-4"
      >
        Quick Actions
      </Text>

      <View className="flex-row justify-between">
        <QuickAction
          label="Send"
          icon={<Feather name="send" size={22} color="#F5A623" />}
          onPress={() => router.push("/(app)/transactions/quote")}
        />

        <QuickAction
          label="Top Up"
          icon={<Feather name="plus-circle" size={22} color="#F5A623" />}
          onPress={() =>
            router.push({
              pathname: "/(app)/topup",
              params: { walletId: walletId ?? "" },
            } as any)
          }
        />

        <QuickAction
          label="Wallets"
          icon={
            <MaterialCommunityIcons
              name="wallet-outline"
              size={22}
              color="#F5A623"
            />
          }
          onPress={() => router.push("/(app)/wallets")}
        />

        <QuickAction
          label="History"
          icon={<Feather name="clock" size={22} color="#F5A623" />}
          onPress={() => router.push("/(app)/transactions")}
        />
      </View>
    </View>
  );
}