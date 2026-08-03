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
import { useTheme } from "@/lib/store/theme.store";
import { Wallet } from "@/lib/api/wallet.api";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function WalletDetailCard({
  wallet,
  onUnlink,
}: {
  wallet: Wallet;
  onUnlink: (id: string) => void;
}) {
  const { isDark } = useTheme();

  const providerInfo = {
    PANWALLET_INTERNAL: {
      label: "PanWallet Internal",
      icon: <Feather name="globe" size={24} color="#0A1628" />,
      color: "bg-[#F5A623]",
      description: "Your main USD wallet",
    },
    MPESA: {
      label: "M-Pesa",
      icon: (
        <MaterialCommunityIcons name="cellphone" size={24} color="#FFFFFF" />
      ),
      color: "bg-green-600",
      description: "Safaricom M-Pesa",
    },
    MTN_MOMO: {
      label: "MTN MoMo",
      icon: <MaterialCommunityIcons name="wallet" size={24} color="#0A1628" />,
      color: "bg-yellow-500",
      description: "MTN Mobile Money",
    },
  }[wallet.provider] ?? {
    label: "Wallet",
    icon: <Feather name="credit-card" size={24} color="#FFFFFF" />,
    color: "bg-slate-700",
    description: "External payment account",
  };

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
      {/* Provider Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b ...">
        <View>
          <Text className="text-2xl font-bold ...">My Wallets</Text>
          <Text className="text-xs ...">{wallets.length} wallet(s) linked</Text>
        </View>
        
        <View className="flex-row items-center space-x-2">
          <ThemeToggle />
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-[#F5A623] items-center justify-center shadow-sm ml-2"
            onPress={() => router.push("/(app)/wallets/link")}
          >
            <Feather name="plus" size={20} color="#0A1628" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet Details Block */}
      <View
        style={{
          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        }}
        className="rounded-xl p-4 mb-4 border"
      >
        <View className="flex-row justify-between mb-3">
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-sm"
          >
            Wallet Number
          </Text>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-medium text-sm"
          >
            {wallet.walletNumber}
          </Text>
        </View>

        <View className="flex-row justify-between mb-3">
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-sm"
          >
            Currency
          </Text>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-medium text-sm"
          >
            {wallet.currency}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-sm"
          >
            Balance
          </Text>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="font-bold text-base"
          >
            {wallet.currency}{" "}
            {parseFloat(wallet.balance).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Unlink Action — Hidden for primary wallet */}
      {!isInternal && (
        <TouchableOpacity
          onPress={handleUnlink}
          className="flex-row items-center justify-center py-3 border border-red-500/30 bg-red-500/10 rounded-xl"
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={14} color="#EF4444" />
          <Text className="text-red-500 text-xs font-semibold ml-2">
            Unlink Wallet
          </Text>
        </TouchableOpacity>
      )}

      {isInternal && (
        <View
          style={{
            backgroundColor: isDark ? "#1E293B" : "#EFF6FF",
            borderColor: isDark ? "#334155" : "#DBEAFE",
          }}
          className="flex-row items-center rounded-xl p-3 border"
        >
          <Feather name="lock" size={14} color="#3B82F6" />
          <Text className="text-blue-500 text-xs ml-2 font-medium flex-1">
            This is your primary wallet and cannot be unlinked.
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function WalletsScreen() {
  const { isDark } = useTheme();
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
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />

      {/* Header */}
      <View
        style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
        className="px-6 py-4 flex-row items-center justify-between border-b"
      >
        <View>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="text-2xl font-bold"
          >
            My Wallets
          </Text>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-xs mt-0.5"
          >
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} linked
          </Text>
        </View>

        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-[#F5A623] items-center justify-center shadow-sm"
          onPress={() => router.push("/(app)/wallets/link")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#0A1628" />
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
            tintColor="#F5A623"
          />
        }
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator color="#F5A623" size="large" className="mt-12" />
        ) : wallets.length === 0 ? (
          <View className="items-center py-16">
            <View
              style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
            >
              <Feather
                name="credit-card"
                size={28}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </View>

            <Text
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              className="font-bold text-lg mb-1"
            >
              No wallets yet
            </Text>

            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs text-center mb-8 leading-5"
            >
              Link your M-Pesa or MTN MoMo wallet to start making transactions.
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

            {/* Link another wallet card */}
            {wallets.length < 3 && (
              <TouchableOpacity
                style={{
                  borderColor: isDark ? "#334155" : "#CBD5E1",
                  backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                }}
                className="border-2 border-dashed rounded-2xl p-6 items-center mb-8"
                onPress={() => router.push("/(app)/wallets/link")}
                activeOpacity={0.8}
              >
                <View
                  style={{ backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }}
                  className="w-10 h-10 rounded-full items-center justify-center mb-2"
                >
                  <Feather
                    name="plus"
                    size={20}
                    color={isDark ? "#94A3B8" : "#64748B"}
                  />
                </View>

                <Text
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  className="font-medium text-xs"
                >
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