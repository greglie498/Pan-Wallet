import React from "react";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/lib/store/theme.store";

interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export function ThemeToggle({ style, size = 18 }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        {
          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        },
        style,
      ]}
      className="w-10 h-10 rounded-full items-center justify-center border shadow-sm"
      activeOpacity={0.8}
    >
      <Feather
        name={isDark ? "sun" : "moon"}
        size={size}
        color={isDark ? "#F5A623" : "#475569"}
      />
    </TouchableOpacity>
  );
}