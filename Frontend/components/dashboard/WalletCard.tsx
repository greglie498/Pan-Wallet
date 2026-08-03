import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/store/theme.store";

export default function WalletCard({ wallet }: { wallet: any }) {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        borderColor: isDark ? "#334155" : "#E2E8F0",
        borderWidth: 1,
        // Soft shadow so white cards pop against light slate background
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 6,
        elevation: isDark ? 0 : 2,
      }}
      className="p-4 rounded-2xl w-64 mr-3"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
          <Text
            style={{ color: isDark ? "#94A3B8" : "#475569" }}
            className="text-xs font-semibold"
          >
            Connected
          </Text>
        </View>
      </View>

      <Text
        style={{ color: isDark ? "#E2E8F0" : "#1E293B" }}
        className="text-sm font-semibold mb-1"
      >
        {wallet.name || wallet.provider}
      </Text>

      <Text
        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
        className="text-xl font-bold"
      >
        {wallet.currency} {parseFloat(wallet.balance).toFixed(2)}
      </Text>

      {/* Footer Divider & Labels with Dynamic High Contrast */}
      <View
        style={{
          borderTopColor: isDark ? "#334155" : "#F1F5F9",
          borderTopWidth: 1,
        }}
        className="flex-row justify-between items-center mt-3 pt-2"
      >
        <Text
          style={{ color: isDark ? "#64748B" : "#64748B" }}
          className="text-[11px] font-medium"
        >
          Wallet
        </Text>
        <Text
          style={{ color: isDark ? "#64748B" : "#64748B" }}
          className="text-[11px] font-medium"
        >
          •••• {wallet.id?.slice(-4)}
        </Text>
      </View>
    </View>
  );
}