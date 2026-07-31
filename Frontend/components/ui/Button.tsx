import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  fullWidth = true,
  disabled,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ButtonProps) {
  const baseClasses =
    "flex-row items-center justify-center rounded-2xl";

  const variantClasses = {
    primary: "bg-accent",
    secondary: "bg-primary-light",
    outline: "bg-transparent border border-accent",
    ghost: "bg-transparent",
  }[variant];

  const heightClasses = {
    sm: "h-11 px-4",
    md: "h-14 px-6",
    lg: "h-16 px-8",
  }[size];

  const textClasses = {
    primary: "text-primary",
    secondary: "text-white",
    outline: "text-accent",
    ghost: "text-accent",
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${heightClasses}
        ${fullWidth ? "w-full" : ""}
        ${(disabled || loading) ? "opacity-60" : ""}
      `}
      style={[
        variant === "primary"
          ? {
              elevation: 5,
              shadowOpacity: 0.15,
              shadowRadius: 10,
              shadowOffset: {
                width: 0,
                height: 4,
              },
            }
          : {},
        style,
      ]}
      {...props}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? "#0A1628" : "#2563EB"}
          />

          <Text
            className={`${textClasses} text-base font-semibold ml-3`}
          >
            {loadingText ?? title}
          </Text>
        </>
      ) : (
        <View className="flex-row items-center">
          {leftIcon && (
            <View className="mr-2">
              {leftIcon}
            </View>
          )}

          <Text
            className={`${textClasses} text-base font-semibold`}
          >
            {title}
          </Text>

          {rightIcon && (
            <View className="ml-2">
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}