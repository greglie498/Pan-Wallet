import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "@/lib/store/theme.store";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function StatCard({ icon, label, value }: Props) {
  const { isDark } = useTheme();

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        borderColor: isDark ? "#334155" : "#E2E8F0",
        borderWidth: 1,
      }}
      className="flex-1 rounded-[20px] p-3.5 mx-1 shadow-sm"
    >
      <View className="mb-2">{icon}</View>
      <Text
        style={{ color: isDark ? "#94A3B8" : "#64748B" }}
        className="text-[11px] font-semibold"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
        className="text-lg font-bold mt-0.5"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}