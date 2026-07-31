import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { Card } from "@/components/ui";
import { Wallet } from "@/lib/api/wallet.api";

interface Props {
  wallet: Wallet;
  onPress: () => void;
}

export default function WalletCard({
  wallet,
  onPress,
}: Props) {

  const provider = {
    PANWALLET_INTERNAL: {
      title: "PanWallet",
      color: "#F5A623",
      icon: (
        <Feather
          name="globe"
          size={28}
          color="#F5A623"
        />
      ),
    },

    MPESA: {
      title: "M-Pesa",
      color: "#22C55E",
      icon: (
        <MaterialCommunityIcons
          name="cellphone"
          size={28}
          color="#22C55E"
        />
      ),
    },

    MTN_MOMO: {
      title: "MTN MoMo",
      color: "#EAB308",
      icon: (
        <MaterialCommunityIcons
          name="wallet"
          size={28}
          color="#EAB308"
        />
      ),
    },
  }[wallet.provider];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width: 200 }}
      className="mr-4"
    >
      <Card
        variant="elevated"
        padding="lg"
      >

        <View className="flex-row justify-between items-center mb-5">

          <View className="flex-row items-center">

            <View
              className="w-2.5 h-2.5 rounded-full mr-2"
              style={{
                backgroundColor:
                  wallet.status === "ACTIVE"
                    ? "#22C55E"
                    : "#EF4444",
              }}
            />

            <Text className="text-slate-500 text-xs font-medium">
              {wallet.status === "ACTIVE"
                ? "Connected"
                : "Inactive"}
            </Text>

          </View>

          {provider?.icon}

        </View>

        <Text className="text-slate-500 text-sm">
          {provider?.title}
        </Text>

        <Text className="text-primary dark:text-white text-sm mt-5">
          {wallet.currency}
        </Text>

        <Text className="text-primary dark:text-white text-3xl font-bold mt-1">
          {Number(wallet.balance).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Text>

        <View className="mt-6 flex-row justify-between items-center">

          <Text className="text-slate-400 text-xs">
            Wallet
          </Text>

          <Text className="text-slate-400 text-xs">
            ••••
            {wallet.id.slice(-4)}
          </Text>

        </View>

      </Card>
    </TouchableOpacity>
  );
}