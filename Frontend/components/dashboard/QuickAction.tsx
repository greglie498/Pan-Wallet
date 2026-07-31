import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
} from "react-native";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

export default function QuickAction({
  icon,
  label,
  onPress,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      className="items-center flex-1"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center shadow-sm">
        {icon}
      </View>

      <Text className="text-primary dark:text-white font-medium text-xs mt-3 text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
}