import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useTheme } from "@/lib/store/theme.store";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export default function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      className="items-center flex-1"
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View
        style={{
          backgroundColor: isDark ? "#1E293B" : "#0F172A",
          borderColor: isDark ? "#334155" : "#1E293B",
        }}
        className="w-14 h-14 rounded-2xl border items-center justify-center shadow-sm mb-2"
      >
        {icon}
      </View>
      {/* Explicit contrast text style */}
      <Text
        style={{ color: isDark ? "#E2E8F0" : "#0F172A" }}
        className="font-semibold text-xs text-center"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}