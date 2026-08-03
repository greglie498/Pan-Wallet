import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "@/lib/store/theme.store";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  style,
  ...props
}: CardProps) {
  const { isDark } = useTheme();

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }[padding];

  // Dynamic colors based on isDark state
  const getVariantStyle = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderColor: isDark ? "#334155" : "#E2E8F0",
          borderWidth: 1,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 10,
          elevation: isDark ? 2 : 4,
        };
      case "outlined":
        return {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderColor: isDark ? "#334155" : "#CBD5E1",
          borderWidth: 1,
        };
      case "default":
      default:
        return {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          borderColor: isDark ? "#334155" : "#F1F5F9",
          borderWidth: 1,
        };
    }
  };

  return (
    <View
      style={[
        { borderRadius: 16 },
        getVariantStyle(),
        style,
      ]}
      className={`${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}