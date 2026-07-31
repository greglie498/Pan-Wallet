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
    <View className="bg-primary rounded-[28px] p-6 shadow-lg">

      <Text className="text-slate-400">
        Total Balance
      </Text>

      <Text className="text-white text-4xl font-bold mt-2">
        {currency} {balance.toLocaleString()}
      </Text>

      <Text className="text-accent mt-2">
        Available Balance
      </Text>

      <View className="flex-row mt-6">

        <TouchableOpacity
          onPress={onTopUp}
          className="flex-1 bg-accent rounded-2xl py-4 mr-2 flex-row justify-center items-center"
        >
          <Feather
            name="plus"
            size={18}
            color="#0A1628"
          />

          <Text className="text-primary font-bold ml-2">
            Top Up
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSend}
          className="flex-1 border border-white/20 rounded-2xl py-4 ml-2 flex-row justify-center items-center"
        >
          <Feather
            name="send"
            size={18}
            color="white"
          />

          <Text className="text-white font-bold ml-2">
            Send
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}