import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface BalanceCardProps {
  balance: number;
  currency: string;
  onTopUp: () => void;
  onSend: () => void;
}

export default function BalanceCard({
  balance,
  currency,
  onTopUp,
  onSend,
}: BalanceCardProps) {
  return (
    // Hero balance card remains dark navy in both themes for brand consistency
    <View className="bg-[#0D1E36] rounded-[24px] p-5 border border-white/10 shadow-lg">
      <Text className="text-slate-400 text-xs font-medium">
        Total Balance
      </Text>

      <Text className="text-white text-3xl font-bold mt-1">
        {currency}{" "}
        {balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>

      <View className="flex-row mt-5">
        <TouchableOpacity
          onPress={onTopUp}
          activeOpacity={0.85}
          className="flex-1 bg-accent rounded-xl py-3 mr-2 flex-row justify-center items-center shadow-sm"
        >
          <Feather name="plus" size={16} color="#0A1628" />
          <Text className="text-[#0A1628] font-bold text-sm ml-1.5">
            Top Up
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSend}
          activeOpacity={0.85}
          className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 ml-2 flex-row justify-center items-center"
        >
          <Feather name="send" size={16} color="white" />
          <Text className="text-white font-bold text-sm ml-1.5">
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}