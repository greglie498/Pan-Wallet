import React from "react";
import { View, Text } from "react-native";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export default function StatCard({
  icon,
  label,
  value,
}: Props) {
  return (
    <View className="flex-1 bg-white dark:bg-gray-800 rounded-[24px] p-4 mx-1">

      <View className="mb-3">
        {icon}
      </View>

      <Text className="text-slate-500 text-xs">
        {label}
      </Text>

      <Text className="text-primary dark:text-white text-xl font-bold mt-1">
        {value}
      </Text>

    </View>
  );
}