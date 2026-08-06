import React from "react";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/lib/store/theme.store";

interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
  size?: number; // Overall diameter of the toggle button
  iconSize?: number; // Optional explicit icon size overriding auto-scale
}

export function ThemeToggle({ style, size = 40, iconSize }: ThemeToggleProps) {
  const { isDark, toggleTheme, toggle } = useTheme();
  const handleToggle = toggleTheme || toggle;
  const calculatedIconSize = iconSize ?? Math.round(size * 0.45);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        },
        style,
      ]}
      className="items-center justify-center border shadow-sm"
    >
      <Feather
        name={isDark ? "sun" : "moon"}
        size={calculatedIconSize}
        color={isDark ? "#F5A623" : "#475569"}
      />
    </TouchableOpacity>
  );
}