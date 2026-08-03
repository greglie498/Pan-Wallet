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

  // Helper to check if a custom background color is passed in className
  const hasCustomBg = /\bbg-/.test(className);

  const getVariantStyle = () => {
    const baseBg = isDark ? "#1E293B" : "#FFFFFF";

    switch (variant) {
      case "elevated":
        return {
          ...(hasCustomBg ? {} : { backgroundColor: baseBg }),
          borderColor: isDark ? "#334155" : "#E2E8F0",
          borderWidth: 1,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: isDark ? 3 : 5,
        };
      case "outlined":
        return {
          ...(hasCustomBg ? {} : { backgroundColor: baseBg }),
          borderColor: isDark ? "#334155" : "#CBD5E1",
          borderWidth: 1,
        };
      case "default":
      default:
        return {
          ...(hasCustomBg ? {} : { backgroundColor: baseBg }),
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