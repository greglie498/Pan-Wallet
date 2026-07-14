import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const variantClasses = {
    default: "bg-white rounded-2xl",
    elevated: "bg-white rounded-2xl shadow-lg shadow-black/10",
    outlined: "bg-white rounded-2xl border border-gray-100",
  }[variant];

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }[padding];

  return (
    <View
      className={`${variantClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}