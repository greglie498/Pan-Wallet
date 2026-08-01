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
import QuickActions from "@/components/dashboard/QuickActions";
import { Wallet } from "@/lib/api/wallet.api";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BalanceCard from "@/components/dashboard/BalanceCard";
import GreetingHeader from "@/components/dashboard/GreetingHeader";
import WalletCarousel from "@/components/dashboard/WalletCarousel";
import WalletCard from "@/components/dashboard/WalletCard";
import { Feather } from "@expo/vector-icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import StatCard from "@/components/dashboard/StatCard";
import FloatingSendButton from "@/components/dashboard/FloatingSendButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

// ── Sub-components ─────────────────────────────────────────────────

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const statusVariant = {
    COMPLETED: "success",
    FAILED: "error",
    PENDING: "pending",
    REVERSED: "warning",
  }[transaction.status] as "success" | "error" | "pending" | "warning";

  const providerIcon = {
    MPESA: "smartphone",
    MTN_MOMO: "wifi",
    PANWALLET_INTERNAL: "globe",
  }[transaction.recipientProvider] ?? "send";

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
        <Text className="text-xl">{providerIcon}</Text>
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
        radius={65}
        innerRadius={42}
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
      height={90}
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
  const { wallets, isLoading: walletsLoading, fetchWallets, forceRefresh } = useWalletStore();
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

  const loadData = useCallback(async (force = false) => {
    await Promise.all([force ? forceRefresh() : fetchWallets(), loadTransactions()]);
  }, [fetchWallets, forceRefresh, loadTransactions]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0A1628"
      />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 180, // space above bottom tabs
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F5A623"
              colors={["#F5A623"]}
            />
          }
        >
          {/* Header */}
          <View className="bg-primary">
            <GreetingHeader
              greeting={getGreeting()}
              firstName={firstName}
              onLogout={logout}
            />
          </View>
          {/* Balance */}
          <View className="bg-primary-card rounded-t-[32px] -mt-6 shadow-sm pt-6">
            <BalanceCard
              balance={totalBalance}
              currency="USD"
              onTopUp={() =>
                router.push({
                  pathname: "/(app)/topup",
                  params: {
                    walletId: internalWallet?.id ?? "",
                  },
                } as any)
              }
              onSend={() =>
                router.push("/(app)/transactions/quote")
              }
            />
          </View>
          <View className="px-6 -mt-4">
            {/* Stats */}
            <View className="flex-row mb-10">
              <StatCard
                icon={
                  <Feather
                    name="bar-chart-2"
                    size={20}
                    color="#F5A623"
                  />
                }
                label="Transactions"
                value={transactions.length.toString()}
              />
              <StatCard
                icon={
                  <Feather
                    name="check-circle"
                    size={20}
                    color="#22C55E"
                  />
                }
                label="Completed"
                value={completedCount.toString()}
              />
              <StatCard
                icon={
                  <Feather
                    name="send"
                    size={20}
                    color="#3B82F6"
                  />
                }
                label="Total Sent"
                value={`$${totalSent.toFixed(0)}`}
              />
            </View>
            {/* Wallets */}
            <View className="rounded-[32px]">
              <WalletCarousel
                wallets={wallets}
                loading={walletsLoading}
              />
              <QuickActions
                walletId={internalWallet?.id}
              />
            </View>
            {/* Transaction Chart */}
            <View className="mb-10 rounded-[32px]">
              <Card
                variant="elevated"
                padding="lg"
              >
                <Feather
                  name="bar-chart-2"
                  size={20}
                  color="#F5A623"
                />
                <Text className="text-primary dark:text-white font-bold text-base mb-4">
                  Transaction Activity
                </Text>
                {
                  transactionsLoading ? (
                    <ActivityIndicator color="#F5A623"/>
                  ) : (
                    <TransactionVolumeChart
                      transactions={transactions}
                      isDark={isDark}
                    />
                  )
                }
              </Card>
            </View>
            {/* Provider Chart */}
            <View className="mb-10 rounded-[32px]">
              <Card
                variant="elevated"
                padding="lg"
              >
                <Feather
                  name="bar-chart-2"
                  size={20}
                  color="#F5A623"
                />
                <Text className="text-primary dark:text-white font-bold text-base mb-4">
                  Spending Distribution
                </Text>
                {
                  transactionsLoading ? (
                    <ActivityIndicator color="#F5A623"/>
                  ) : (
                    <SpendByProviderChart
                      transactions={transactions}
                      isDark={isDark}
                    />
                  )
                }
              </Card>
            </View>
            {/* Recent Transactions */}
            <RecentTransactions
              loading={transactionsLoading}
              transactions={transactions}
            />
          </View>
        </ScrollView>
        {/* Floating button stays above everything */}
        <FloatingSendButton />
      </View>
    </SafeAreaView>
);
}