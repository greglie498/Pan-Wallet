import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge, Button } from "@/components/ui";
import { useWalletStore } from "@/lib/store";
import { Wallet } from "@/lib/api/wallet.api";

function WalletDetailCard({
  wallet,
  onUnlink,
}: {
  wallet: Wallet;
  onUnlink: (id: string) => void;
}) {
  const providerInfo = {
    PANWALLET_INTERNAL: {
      label: "PanWallet Internal",
      emoji: "🌍",
      color: "bg-accent",
      description: "Your main USD wallet",
    },
    MPESA: {
      label: "M-Pesa",
      emoji: "📱",
      color: "bg-green-500",
      description: "Safaricom M-Pesa",
    },
    MTN_MOMO: {
      label: "MTN MoMo",
      emoji: "💛",
      color: "bg-yellow-500",
      description: "MTN Mobile Money",
    },
  }[wallet.provider];

  const isInternal = wallet.provider === "PANWALLET_INTERNAL";

  const handleUnlink = () => {
    Alert.alert(
      "Unlink Wallet",
      `Are you sure you want to unlink your ${providerInfo?.label} wallet?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: () => onUnlink(wallet.id),
        },
      ]
    );
  };

  return (
    <Card variant="elevated" padding="lg" className="mb-4">
      {/* Provider header */}
      <View className="flex-row items-center mb-4">
        <View
          className={`w-12 h-12 rounded-2xl ${providerInfo?.color} items-center justify-center mr-4`}
        >
          <Text className="text-2xl">{providerInfo?.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-primary font-bold text-base">
            {providerInfo?.label}
          </Text>
          <Text className="text-muted text-xs">
            {providerInfo?.description}
          </Text>
        </View>
        <Badge
          label={wallet.status}
          variant={wallet.status === "ACTIVE" ? "success" : "error"}
        />
      </View>

      {/* Wallet details */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row justify-between mb-3">
          <Text className="text-muted text-sm">Wallet Number</Text>
          <Text className="text-primary font-medium text-sm">
            {wallet.walletNumber}
          </Text>
        </View>
        <View className="flex-row justify-between mb-3">
          <Text className="text-muted text-sm">Currency</Text>
          <Text className="text-primary font-medium text-sm">
            {wallet.currency}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted text-sm">Balance</Text>
          <Text className="text-primary font-bold text-base">
            {wallet.currency}{" "}
            {parseFloat(wallet.balance).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Unlink button — not shown for internal wallet */}
      {!isInternal && (
        <TouchableOpacity
          onPress={handleUnlink}
          className="flex-row items-center justify-center py-3 border border-red-200 rounded-xl"
        >
          <Text className="text-error text-sm font-medium">
            Unlink Wallet
          </Text>
        </TouchableOpacity>
      )}

      {isInternal && (
        <View className="flex-row items-center bg-blue-50 rounded-xl p-3">
          <Text className="text-blue-600 text-xs">
            🔒 This is your primary wallet and cannot be unlinked.
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function WalletsScreen() {
  const { wallets, isLoading, fetchWallets, unlinkWallet } = useWalletStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWallets();
    setRefreshing(false);
  };

  const handleUnlink = async (walletId: string) => {
    try {
      await unlinkWallet(walletId);
    } catch {
      Alert.alert("Error", "Failed to unlink wallet. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View>
          <Text className="text-primary dark:text-white text-2xl font-bold">My Wallets</Text>
          <Text className="text-muted text-sm">
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} linked
          </Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-accent items-center justify-center"
          onPress={() => router.push("/(app)/wallets/link")}
        >
          <Text className="text-primary font-bold text-lg">+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F5A623"]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator color="#F5A623" className="mt-8" />
        ) : wallets.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">💳</Text>
            <Text className="text-primary font-bold text-lg mb-2">
              No wallets yet
            </Text>
            <Text className="text-muted text-sm text-center mb-8">
              Link your M-Pesa or MTN MoMo{"\n"}wallet to get started
            </Text>
            <Button
              title="Link a Wallet"
              variant="primary"
              size="md"
              fullWidth={false}
              onPress={() => router.push("/(app)/wallets/link")}
            />
          </View>
        ) : (
          <>
            {wallets.map((wallet) => (
              <WalletDetailCard
                key={wallet.id}
                wallet={wallet}
                onUnlink={handleUnlink}
              />
            ))}

            {/* Add another wallet */}
            {wallets.length < 3 && (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-200 rounded-2xl p-6 items-center mb-8"
                onPress={() => router.push("/(app)/wallets/link")}
              >
                <Text className="text-3xl mb-2">+</Text>
                <Text className="text-muted font-medium">
                  Link another wallet
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}