import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from "react-native";

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
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? "border-error"
    : focused
    ? "border-accent"
    : "border-gray-200";

  return (
    <View className="w-full mb-4">
      {label && (
        <Text className="text-primary font-medium text-sm mb-2">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center bg-white dark:bg-gray-800 border-2 ${borderClass} rounded-xl px-4 h-14`}
      >
        {leftIcon && (
          <View className="mr-3">{leftIcon}</View>
        )}

        <TextInput
          className="flex-1 text-primary dark:text-white text-base"
          placeholderTextColor={focused ? "#F5A623" : "#94A3B8"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            className="ml-3"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-error text-xs mt-1 ml-1">
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text className="text-muted text-xs mt-1 ml-1">
          {hint}
        </Text>
      )}
    </View>
  );
}