import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from "react-native";
import { useTheme } from "@/lib/store/theme.store";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  editable = true,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { isDark } = useTheme();

  // Dynamic theme container colors
  const getContainerClass = () => {
    if (error) {
      return isDark
        ? "border-red-500/80 bg-red-950/20"
        : "border-red-500 bg-red-50";
    }
    if (focused) {
      return isDark
        ? "border-amber-500 bg-amber-500/10"
        : "border-amber-500 bg-amber-50/50";
    }
    return isDark
      ? "border-slate-800 bg-slate-900/60"
      : "border-slate-200 bg-white";
  };

  return (
    <View className="w-full mb-5">
      {label && (
        <Text
          style={{ color: isDark ? "#E2E8F0" : "#334155" }}
          className="text-sm font-semibold mb-2"
        >
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center border-2 rounded-2xl px-4 h-14 ${getContainerClass()}`}
      >
        {leftIcon && (
          <View
            className={`mr-3 ${
              focused ? "opacity-100" : "opacity-60"
            }`}
          >
            {leftIcon}
          </View>
        )}

        <TextInput
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          className="flex-1 text-base font-medium"
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          returnKeyType="next"
          blurOnSubmit={false}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="ml-3"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <Text className="text-red-500 text-xs font-medium mt-2 ml-1">
          {error}
        </Text>
      )}

      {!error && !!hint && (
        <Text
          style={{ color: isDark ? "#94A3B8" : "#64748B" }}
          className="text-xs mt-2 ml-1"
        >
          {hint}
        </Text>
      )}
    </View>
  );
}