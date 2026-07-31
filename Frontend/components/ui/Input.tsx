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
  editable = true,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const containerClass = error
    ? "border-red-500 bg-red-50"
    : focused
    ? "border-accent bg-primary/5"
    : "border-slate-200 bg-white";

  return (
    <View className="w-full mb-5">
      {label && (
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center border-2 rounded-2xl px-4 h-14 ${containerClass}`}
      >
        <View
          className={`mr-3 ${
            focused ? "opacity-100" : "opacity-60"
          }`}
        >
          {leftIcon}
        </View>

        <TextInput
          className="flex-1 text-base text-slate-900 dark:text-white"
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={8}
            className="ml-3"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {!!error && (
        <Text className="text-red-500 text-xs mt-2 ml-1">
          {error}
        </Text>
      )}

      {!error && !!hint && (
        <Text className="text-slate-500 text-xs mt-2 ml-1">
          {hint}
        </Text>
      )}
    </View>
  );
}