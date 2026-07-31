import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface AuthFooterProps {
  text: string;
  action: string;
  onPress: () => void;
}

export default function AuthFooter({
  text,
  action,
  onPress,
}: AuthFooterProps) {
  return (
    <View className="flex-row justify-center items-center mt-6">
      <Text className="text-slate-400">
        {text}
      </Text>

      <TouchableOpacity onPress={onPress}>
        <Text className="text-accent font-bold ml-2">
          {action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}