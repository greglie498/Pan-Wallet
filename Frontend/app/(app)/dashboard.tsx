import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Badge } from "@/components/ui";
import { useAuthStore, useWalletStore } from "@/lib/store";
import { transactionApi, Transaction } from "@/lib/api";
import { Wallet } from "@/lib/api/wallet.api";

// ── Sub-components ─────────────────────────────────────────────────

function WalletCard({
  wallet,
  onPress,
}: {
  wallet: Wallet;
  onPress: () => void;
}) {
  const providerInfo = {
    PANWALLET_INTERNAL: { label: "PanWallet", emoji: "🌍", color: "bg-accent" },
    MPESA: { label: "M-Pesa", emoji: "📱", color: "bg-green-500" },
    MTN_MOMO: { label: "MTN MoMo", emoji: "💛", color: "bg-yellow-500" },
  }[wallet.provider];

  return (
    <TouchableOpacity onPress={onPress} className="mr-4" style={{ width: 160 }}>
      <Card variant="elevated" padding="md">
        {/* Provider badge */}
        <View
          className={`w-10 h-10 rounded-xl ${providerInfo?.color} items-center justify-center mb-3`}
        >
          <Text className="text-xl">{providerInfo?.emoji}</Text>
        </View>

        <Text className="text-muted text-xs font-medium mb-1">
          {providerInfo?.label}
        </Text>

        <Text className="text-primary text-lg font-bold" numberOfLines={1}>
          {wallet.currency}{" "}
          {parseFloat(wallet.balance).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        <View className="mt-2">
          <Badge
            label={wallet.status}
            variant={wallet.status === "ACTIVE" ? "success" : "error"}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const statusVariant = {
    COMPLETED: "success",
    FAILED: "error",
    PENDING: "pending",
    REVERSED: "warning",
  }[transaction.status] as "success" | "error" | "pending" | "warning";

  const providerEmoji = {
    MPESA: "📱",
    MTN_MOMO: "💛",
    PANWALLET_INTERNAL: "🌍",
  }[transaction.recipientProvider] ?? "💸";

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/transactions/${transaction.id}`)}
      className="flex-row items-center py-4 border-b border-gray-100"
    >
      {/* Provider icon */}
      <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-4">
        <Text className="text-xl">{providerEmoji}</Text>
      </View>

      {/* Details */}
      <View className="flex-1">
        <Text className="text-primary font-semibold text-sm" numberOfLines={1}>
          To {transaction.recipientNumber}
        </Text>
        <Text className="text-muted text-xs mt-0.5">{formattedDate}</Text>
      </View>

      {/* Amount + status */}
      <View className="items-end">
        <Text className="text-primary font-bold text-sm mb-1">
          -{parseFloat(transaction.amount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </Text>
        <Badge label={transaction.status} variant={statusVariant} size="sm" />
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { wallets, isLoading: walletsLoading, fetchWallets } = useWalletStore();

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const totalBalance = wallets
    .filter((w) => w.provider === "PANWALLET_INTERNAL")
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await transactionApi.list();
      setTransactions(data.slice(0, 5)); // Show last 5 on dashboard
    } catch {
      // Fail silently on dashboard — full history is on transactions screen
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([fetchWallets(), loadTransactions()]);
  }, [fetchWallets, loadTransactions]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F5A623"
            colors={["#F5A623"]}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View className="bg-primary px-6 pt-4 pb-8">
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-gray-400 text-sm">
                {getGreeting()},
              </Text>
              <Text className="text-white text-xl font-bold">
                {firstName} 👋
              </Text>
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-primary-light items-center justify-center"
              onPress={() => logout()}
            >
              <Text className="text-white text-sm">↩</Text>
            </TouchableOpacity>
          </View>

          {/* ── Total balance card ─────────────────────────────── */}
          <View className="bg-primary-light rounded-2xl p-5">
            <Text className="text-gray-400 text-sm mb-1">
              Total Balance
            </Text>
            <Text className="text-white text-4xl font-bold mb-3">
              ${totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-success mr-2" />
              <Text className="text-gray-400 text-xs">
                {wallets.filter((w) => w.status === "ACTIVE").length} active
                wallet{wallets.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-4">

          {/* ── Wallet list ────────────────────────────────────── */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-primary text-lg font-bold">
                My Wallets
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/wallets")}
              >
                <Text className="text-accent text-sm font-semibold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            {walletsLoading ? (
              <ActivityIndicator color="#F5A623" />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-2"
                contentContainerStyle={{ paddingHorizontal: 8 }}
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

                {/* Add wallet button */}
                <TouchableOpacity
                  className="mr-4 items-center justify-center"
                  style={{ width: 160 }}
                  onPress={() => router.push("/(app)/wallets/link")}
                >
                  <Card variant="outlined" padding="md">
                    <View className="items-center justify-center py-4">
                      <View className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 items-center justify-center mb-2">
                        <Text className="text-gray-400 text-xl">+</Text>
                      </View>
                      <Text className="text-muted text-sm text-center">
                        Link a wallet
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>

          {/* ── Send money button ──────────────────────────────── */}
          <View className="mb-6">
            <Button
              title="Send Money"
              variant="primary"
              size="lg"
              onPress={() => router.push("/(app)/transactions/quote")}
            />
          </View>

          {/* ── Recent transactions ────────────────────────────── */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-primary text-lg font-bold">
                Recent Transactions
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/transactions")}
              >
                <Text className="text-accent text-sm font-semibold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <Card variant="default" padding="md">
              {transactionsLoading ? (
                <ActivityIndicator color="#F5A623" className="py-4" />
              ) : transactions.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-4xl mb-3">💸</Text>
                  <Text className="text-primary font-semibold mb-1">
                    No transactions yet
                  </Text>
                  <Text className="text-muted text-sm text-center">
                    Send money to get started
                  </Text>
                </View>
              ) : (
                transactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}