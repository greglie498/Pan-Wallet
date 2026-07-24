import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { Card, Button, Badge } from "@/components/ui";
import { useAuthStore, useWalletStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { transactionApi, Transaction } from "@/lib/api";
import { Wallet } from "@/lib/api/wallet.api";
import { ThemeToggle } from "@/components/ThemeToggle";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

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

// ── Charts ─────────────────────────────────────────────────────────

function SpendByProviderChart({
  transactions,
  isDark,
}: {
  transactions: Transaction[];
  isDark: boolean;
}) {
  const providerTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.status === "COMPLETED")
    .forEach((t) => {
      const p = t.recipientProvider;
      providerTotals[p] = (providerTotals[p] ?? 0) + parseFloat(t.amount);
    });

  const colors = ["#F5A623", "#22C55E", "#3B82F6"];
  const labels = Object.keys(providerTotals);

  if (labels.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-muted dark:text-gray-400 text-sm">
          No completed transactions yet
        </Text>
      </View>
    );
  }

  const pieData = labels.map((label, i) => ({
    value: providerTotals[label] ?? 0,
    color: colors[i % colors.length] ?? "#F5A623",
    text: label === "PANWALLET_INTERNAL" ? "Internal" :
          label === "MPESA" ? "M-Pesa" : "MTN",
  }));

  return (
    <View className="items-center">
      <PieChart
        data={pieData}
        donut
        radius={80}
        innerRadius={55}
        centerLabelComponent={() => (
          <Text className="text-primary dark:text-white font-bold text-xs text-center">
            By{"\n"}Provider
          </Text>
        )}
      />
      <View className="flex-row flex-wrap justify-center mt-4">
        {pieData.map((item) => (
          <View key={item.text} className="flex-row items-center mr-4 mb-2">
            <View
              className="w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-muted dark:text-gray-400 text-xs">
              {item.text}: ${(item.value).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TransactionVolumeChart({
  transactions,
  isDark,
}: {
  transactions: Transaction[];
  isDark: boolean;
}) {
  // Build last 7 days data
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    days[key] = 0;
  }

  transactions
    .filter((t) => t.status === "COMPLETED")
    .forEach((t) => {
      const d = new Date(t.createdAt);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      if (key in days) {
        days[key] = (days[key] ?? 0) + parseFloat(t.amount);
      }
    });

  const barData = Object.entries(days).map(([label, value]) => ({
    value: Math.round(value * 100) / 100,
    label,
    frontColor: "#F5A623",
    topLabelComponent: () =>
      value > 0 ? (
        <Text style={{ fontSize: 8, color: isDark ? "#9CA3AF" : "#94A3B8" }}>
          ${value.toFixed(0)}
        </Text>
      ) : null,
  }));

  return (
    <BarChart
      data={barData}
      width={CHART_WIDTH - 40}
      height={120}
      barWidth={28}
      spacing={12}
      roundedTop
      hideRules
      xAxisThickness={0}
      yAxisThickness={0}
      yAxisTextStyle={{ color: isDark ? "#9CA3AF" : "#94A3B8", fontSize: 10 }}
      xAxisLabelTextStyle={{ color: isDark ? "#9CA3AF" : "#94A3B8", fontSize: 10 }}
      noOfSections={3}
      maxValue={
        Math.max(...Object.values(days), 10)
      }
    />
  );
}


// ── Main screen ────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { wallets, isLoading: walletsLoading, fetchWallets } = useWalletStore();
  const { isDark } = useTheme();

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const internalWallet = wallets.find(
    (w) => w.provider === "PANWALLET_INTERNAL"
  );


  const totalBalance = wallets
    .filter((w) => w.provider === "PANWALLET_INTERNAL")
    .reduce((sum, w) => sum + parseFloat(w.balance), 0);

  const completedCount = transactions.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  const totalSent = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

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
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
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

            <View className="flex-row items-center">
              <ThemeToggle size={40} />
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-primary-light items-center justify-center ml-2"
                onPress={() => logout()}
              >
                <Text className="text-white text-sm">↩</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-6 -mt-12">

          {/* ── Balance card ───────────────────────────────────── */}
          <View className="bg-primary-light dark:bg-gray-800 rounded-2xl p-5">
            <Text className="text-gray-400 text-sm mb-1">Total Balance</Text>
            <Text className="text-white text-4xl font-bold mb-1">
              ${totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
            <Text className="text-gray-400 text-xs mb-4">
              USD • PanWallet Internal
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 bg-accent rounded-xl py-3 items-center mr-2"
                onPress={() =>
                  router.push({
                    pathname: "/(app)/topup",
                    params: { walletId: internalWallet?.id ?? "" },
                  } as any)
                }
              >
                <Text className="text-primary font-bold text-sm">
                  ＋ Top Up
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white/10 rounded-xl py-3 items-center ml-2"
                onPress={() =>
                  router.push("/(app)/transactions/quote" as any)
                }
              >
                <Text className="text-white font-bold text-sm">
                  💸 Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-6 -mt-4">

          {/* ── Quick stats ────────────────────────────────────── */}
          <View className="flex-row mb-6 -mx-2">
            {[
              {
                label: "Transactions",
                value: transactions.length.toString(),
                emoji: "📊",
              },
              {
                label: "Completed",
                value: completedCount.toString(),
                emoji: "✅",
              },
              {
                label: "Total Sent",
                value: `$${totalSent.toFixed(0)}`,
                emoji: "💸",
              },
            ].map((stat) => (
              <View key={stat.label} className="flex-1 mx-2">
                <Card variant="elevated" padding="sm">
                  <Text className="text-xl mb-1">{stat.emoji}</Text>
                  <Text className="text-primary dark:text-white font-bold text-lg">
                    {stat.value}
                  </Text>
                  <Text className="text-muted dark:text-gray-400 text-xs">
                    {stat.label}
                  </Text>
                </Card>
              </View>
            ))}
          </View>


          {/* Wallet Section */}

          <View className="mb-6">

            <View className="flex-row justify-between items-center mb-4">

              <Text className="text-primary text-xl font-extrabold">
                My Wallets
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(app)/wallets")}
              >
                <Text className="text-muted text-sm font-medium">
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
                contentContainerStyle={{
                  paddingRight: 16,
                }}
              >
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onPress={() => router.push("/(app)/wallets")}
                  />
                ))}

                <TouchableOpacity
                  style={{ width: 160 }}
                  className="mr-4"
                  onPress={() => router.push("/(app)/wallets/link")}
                >
                  <Card variant="elevated" padding="md">

                    <View className="items-center justify-center py-5">

                      <View className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 items-center justify-center mb-3">

                        <Text className="text-primary dark:text-white text-2xl font-bold">
                          +
                        </Text>

                      </View>

                      <Text className="text-muted dark:text-gray-400 text-sm">
                        Link Wallet
                      </Text>

                    </View>

                  </Card>
                </TouchableOpacity>
              </ScrollView>
            )}

          </View>

          {/* ── Transaction Volume Chart ──────────────────────── */}
          <View className="mb-6">
            <Card variant="elevated" padding="lg">
              <Text className="text-primary dark:text-white font-bold text-base mb-4">
                📈 Transaction Volume (7 days)
              </Text>
              {transactionsLoading ? (
                <ActivityIndicator color="#F5A623" />
              ) : (
                <TransactionVolumeChart
                  transactions={transactions}
                  isDark={isDark}
                />
              )}
            </Card>
          </View>

          {/* ── Spend by Provider Chart ───────────────────────── */}
          <View className="mb-6">
            <Card variant="elevated" padding="lg">
              <Text className="text-primary dark:text-white font-bold text-base mb-4">
                🍩 Spend by Provider
              </Text>
              {transactionsLoading ? (
                <ActivityIndicator color="#F5A623" />
              ) : (
                <SpendByProviderChart
                  transactions={transactions}
                  isDark={isDark}
                />
              )}
            </Card>
          </View>


          <View className="h-px bg-gray-100 mb-8" />

            {/* Send Money */}

            <View className="mb-8">

              <Button
                title="Send Money"
                variant="primary"
                size="lg"
                onPress={() =>
                  router.push("/(app)/transactions/quote")
                }
            />

          </View>

          <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-graay-700" />
          {/* ── Recent transactions ────────────────────────────── */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-primary text-xl font-extrabold">
                Recent Transactions
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(app)/transactions")}
              >
                <Text className="text-muted text-sm font-medium">
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