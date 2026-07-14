import React from "react";
import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "success" | "error" | "warning" | "pending" | "info";
  size?: "sm" | "md";
}

export function Badge({
  label,
  variant = "info",
  size = "sm",
}: BadgeProps) {
  const variantClasses = {
    success: "bg-green-100",
    error: "bg-red-100",
    warning: "bg-yellow-100",
    pending: "bg-blue-100",
    info: "bg-gray-100",
  }[variant];

  const textVariantClasses = {
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-yellow-700",
    pending: "text-blue-700",
    info: "text-gray-700",
  }[variant];

  const sizeClasses = {
    sm: "px-2 py-0.5",
    md: "px-3 py-1",
  }[size];

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
  }[size];

  return (
    <View
      className={`${variantClasses} ${sizeClasses} rounded-full self-start`}
    >
      <Text
        className={`${textVariantClasses} ${textSizeClasses} font-medium`}
      >
        {label}
      </Text>
    </View>
  );
}