import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui";
import { Wallet } from "@/lib/api/wallet.api";
import WalletCard from "./WalletCard";

interface Props {
  wallets: Wallet[];
  loading: boolean;
}

export default function WalletCarousel({
  wallets,
  loading,
}: Props) {
  if (loading) {
    return (
      <ActivityIndicator
        color="#F5A623"
      />
    );
  }

  return (
    <>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-primary text-xl font-bold">
          My Wallets
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push("/(app)/wallets")
          }
        >
          <Text className="text-accent">
            See all
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {wallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onPress={() =>
              router.push("/(app)/wallets")
            }
          />
        ))}

        <TouchableOpacity
          style={{ width: 180 }}
          onPress={() =>
            router.push("/(app)/wallets/link")
          }
          className="mr-4"
        >
          <Card
            variant="elevated"
            padding="md"
          >
            <View className="items-center justify-center py-8">

              <View className="w-14 h-14 rounded-full border-2 border-dashed border-accent items-center justify-center">

                <Text className="text-accent text-3xl">
                  +
                </Text>

              </View>

              <Text className="mt-4 text-slate-500">
                Link Wallet
              </Text>

            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}