import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemeToggle } from "@/components/ThemeToggle";

interface GreetingHeaderProps {
  greeting: string;
  firstName: string;
  onLogout: () => void;
}

export default function GreetingHeader({
  greeting,
  firstName,
  onLogout,
}: GreetingHeaderProps) {
  return (
    <View className="flex-row justify-between items-center py-2">
      <View>
        <Text className="text-slate-300 text-xs font-medium uppercase tracking-wider">
          {greeting}
        </Text>
        <Text className="text-white text-2xl font-bold mt-0.5">
          {firstName}
        </Text>
        <Text className="text-accent mt-1 tracking-[2px] text-[10px] font-bold">
          PAN-AFRICAN WALLET
        </Text>
      </View>

      <View className="flex-row items-center">
        <ThemeToggle size={38} />
        
        <TouchableOpacity
          onPress={onLogout}
          activeOpacity={0.8}
          className="ml-3 w-[38px] h-[38px] rounded-full bg-white/10 border border-white/15 items-center justify-center active:bg-white/20"
        >
          <Feather name="log-out" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}