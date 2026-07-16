import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "flex-row items-center justify-center rounded-xl";

  const variantClasses = {
    primary: "bg-accent",
    secondary: "bg-primary",
    outline: "bg-transparent border-2 border-primary",
    ghost: "bg-transparent",
  }[variant];

  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-6 py-4",
    lg: "px-8 py-5",
  }[size];

  const textVariantClasses = {
    primary: "text-primary font-bold",
    secondary: "text-white font-bold",
    outline: "text-primary font-bold",
    ghost: "text-primary font-medium",
  }[variant];

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size];

  const disabledClasses =
    disabled || loading ? "opacity-50" : "opacity-100";

  const widthClasses = fullWidth ? "w-full" : "";

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${widthClasses}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#0A1628" : "#F5A623"}
        />
      ) : (
        <Text
          className={`${textVariantClasses} ${textSizeClasses}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}