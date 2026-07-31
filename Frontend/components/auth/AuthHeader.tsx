import React from "react";
import { View, Text, Image } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({
  title,
  subtitle,
}: AuthHeaderProps) {
  return (
    <View className="items-center px-6 pt-4 pb-8">
      <Image
        source={require("@/assets/images/panwallet-logo-dark.png")}
        className="w-24 h-24 mb-6"
        resizeMode="contain"
      />

      <Text className="text-white text-3xl font-bold text-center">
        {title}
      </Text>

      <Text className="text-slate-400 text-center mt-3 leading-6">
        {subtitle}
      </Text>
    </View>
  );
}