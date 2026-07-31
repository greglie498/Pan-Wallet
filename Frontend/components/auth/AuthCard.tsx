import React from "react";
import { View } from "react-native";

interface AuthCardProps {
  children: React.ReactNode;
}

export default function AuthCard({
  children,
}: AuthCardProps) {
  return (
    <View className="bg-primary-light rounded-3xl p-6 mt-6">
      {children}
    </View>
  );
}