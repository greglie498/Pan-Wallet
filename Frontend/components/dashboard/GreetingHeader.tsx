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
    <View className="bg-primary px-6 pt-4 pb-10 rounded-b-[32px]">

      <View className="flex-row justify-between items-center">

        <View>

          <Text className="text-slate-400 text-sm">
            {greeting}
          </Text>

          <Text className="text-white text-3xl font-bold mt-1">
            {firstName}
          </Text>

          <Text className="text-accent mt-2 tracking-[2px] text-xs">
            PAN-AFRICAN WALLET
          </Text>

        </View>

        <View className="flex-row">

          <ThemeToggle size={42} />

          <TouchableOpacity
            onPress={onLogout}
            className="ml-3 w-11 h-11 rounded-full bg-primary-light items-center justify-center"
          >
            <Feather
              name="log-out"
              size={20}
              color="white"
            />
          </TouchableOpacity>

        </View>

      </View>

    </View>
  );
}