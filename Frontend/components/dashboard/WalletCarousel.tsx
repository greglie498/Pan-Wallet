import React from "react";
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { Wallet } from "@/lib/api/wallet.api";
import { useTheme } from "@/lib/store/theme.store";
import WalletCard from "./WalletCard";

interface Props {
  wallets: Wallet[];
  loading: boolean;
}

export default function WalletCarousel({ wallets, loading }: Props) {
  const { isDark } = useTheme();

  if (loading) {
    return <ActivityIndicator color="#F5A623" className="py-6" />;
  }

  return (
    <>
      {/* Header Row */}
      <View className="flex-row justify-between items-center mb-4">
        <Text
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          className="text-lg font-bold"
        >
          My Wallets
        </Text>

        <TouchableOpacity onPress={() => router.push("/(app)/wallets")}>
          <Text className="text-[#F5A623] font-semibold text-sm">See all</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onPress={() => router.push("/(app)/wallets")}
          />
        ))}

        {/* Link Wallet Button */}
        <TouchableOpacity
          style={{ width: 170 }}
          onPress={() => router.push("/(app)/wallets/link")}
          activeOpacity={0.8}
        >
          <Card variant="elevated" padding="md">
            <View className="items-center justify-center py-7">
              <View className="w-12 h-12 rounded-full border-2 border-dashed border-[#F5A623] items-center justify-center">
                <Text className="text-[#F5A623] text-2xl font-light">+</Text>
              </View>
              <Text
                style={{ color: isDark ? "#94A3B8" : "#475569" }}
                className="mt-3 text-xs font-semibold"
              >
                Link Wallet
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}