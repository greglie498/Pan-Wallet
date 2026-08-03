import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { Card } from "@/components/ui";
import { useAuthStore, useWalletStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { transactionApi, Transaction } from "@/lib/api";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BalanceCard from "@/components/dashboard/BalanceCard";
import GreetingHeader from "@/components/dashboard/GreetingHeader";
import WalletCarousel from "@/components/dashboard/WalletCarousel";
import StatCard from "@/components/dashboard/StatCard";
import FloatingSendButton from "@/components/dashboard/FloatingSendButton";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

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
        <Text className="text-slate-500 dark:text-slate-400 text-sm">
          No completed transactions yet
        </Text>
      </View>
    );
  }

  const pieData = labels.map((label, i) => ({
    value: providerTotals[label] ?? 0,
    color: colors[i % colors.length] ?? "#F5A623",
    text:
      label === "PANWALLET_INTERNAL"
        ? "Internal"
        : label === "MPESA"
        ? "M-Pesa"
        : "MTN",
  }));

  return (
    <View className="items-center">
      <PieChart
        data={pieData}
        donut
        radius={65}
        innerRadius={42}
        centerLabelComponent={() => (
          <Text className="text-slate-900 dark:text-white font-bold text-xs text-center">
            By{"\n"}Provider
          </Text>
        )}
      />
      <View className="flex-row flex-wrap justify-center mt-4">
        {pieData.map((item) => (
          <View key={item.text} className="flex-row items-center mr-4 mb-2">
            <View
              className="w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: item.color }}
            />
            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
              {item.text}: ${item.value.toFixed(2)}
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
        <Text style={{ fontSize: 9, color: isDark ? "#9CA3AF" : "#64748B", marginBottom: 2 }}>
          ${value.toFixed(0)}
        </Text>
      ) : null,
  }));

  return (
    <BarChart
      data={barData}
      width={CHART_WIDTH - 40}
      height={110}
      barWidth={26}
      spacing={14}
      roundedTop
      hideRules
      xAxisThickness={0}
      yAxisThickness={0}
      yAxisTextStyle={{ color: isDark ? "#9CA3AF" : "#64748B", fontSize: 10 }}
      xAxisLabelTextStyle={{
        color: isDark ? "#9CA3AF" : "#64748B",
        fontSize: 10,
        fontWeight: "500",
      }}
      noOfSections={3}
      maxValue={Math.max(...Object.values(days), 10)}
    />
  );
}

// ── Main Screen ────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user, logout, fetchProfile } = useAuthStore();
  const {
    wallets,
    isLoading: walletsLoading,
    fetchWallets,
    forceRefresh,
  } = useWalletStore();
  const { isDark } = useTheme();

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Derive User Greeting Name safely (checking name, fullName, or email handle)
  const displayName =
    user?.name ||
    (user as any)?.fullName ||
    (user as any)?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const firstName = displayName.split(" ")[0];

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

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await transactionApi.list();
      setTransactions(data.slice(0, 5));
    } catch {
      // Fail silently on dashboard
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const loadData = useCallback(
    async (force = false) => {
      // Refresh profile if user isn't populated
      if (typeof fetchProfile === "function" && !user?.name) {
        fetchProfile().catch(() => {});
      }
      await Promise.all([
        force ? forceRefresh() : fetchWallets(),
        loadTransactions(),
      ]);
    },
    [fetchWallets, forceRefresh, loadTransactions, fetchProfile, user]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  return (
    <SafeAreaView
      style= { { backgroundColor: isDark ? "#0A1628" : "#F8FAFC"}}
      className="flex-1"
      edges={["top", "left", "right"]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#0F172A"}
      />
      <View className="flex-1 relative">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 110,
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
          {/* Top Navy Header Block (Looks rich & premium in both modes) */}
          <View className="bg-[#0F172A] dark:bg-[#0A1628] pt-2 pb-6 px-6 rounded-b-[32px] shadow-md">
            <GreetingHeader
              greeting={getGreeting()}
              firstName={firstName}
              onLogout={logout}
            />
            <View className="mt-4">
              <BalanceCard
                balance={totalBalance}
                currency="USD"
                onTopUp={() =>
                  router.push({
                    pathname: "/(app)/topup",
                    params: { walletId: internalWallet?.id ?? "" },
                  } as any)
                }
                onSend={() => router.push("/(app)/transactions/quote")}
              />
            </View>
          </View>

          {/* Body Section */}
          <View className="px-6 pt-6">
            {/* Stats row */}
            <View className="flex-row mb-8 -mx-1">
              <StatCard
                icon={<Feather name="bar-chart-2" size={18} color="#F5A623" />}
                label="Transactions"
                value={transactions.length.toString()}
              />
              <StatCard
                icon={<Feather name="check-circle" size={18} color="#22C55E" />}
                label="Completed"
                value={completedCount.toString()}
              />
              <StatCard
                icon={<Feather name="send" size={18} color="#3B82F6" />}
                label="Total Sent"
                value={`$${totalSent.toFixed(0)}`}
              />
            </View>

            {/* Wallets Carousel */}
            <View className="mb-8">
              <WalletCarousel wallets={wallets} loading={walletsLoading} />
            </View>

            {/* Quick Actions */}
            <QuickActions walletId={internalWallet?.id} />

            {/* Transaction Activity Chart */}
            <View className="mb-8">
              <Card variant="elevated" padding="lg">
                <View className="flex-row items-center mb-4">
                  <Feather name="bar-chart-2" size={18} color="#F5A623" />
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    className="font-bold text-base ml-2"
                  >
                    Transaction Activity
                  </Text>
                </View>
                {transactionsLoading ? (
                  <ActivityIndicator color="#F5A623" className="py-6" />
                ) : (
                  <TransactionVolumeChart
                    transactions={transactions}
                    isDark={isDark}
                  />
                )}
              </Card>
            </View>
              
          

            {/* Spending Distribution Chart */}
            <View className="mb-8">
              <Card variant="elevated" padding="lg">
                <View className="flex-row items-center mb-4">
                  <Feather name="pie-chart" size={18} color="#F5A623" />
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    className="font-bold text-base ml-2"
                  >
                    Spending Distribution
                  </Text>
                </View>
                {transactionsLoading ? (
                  <ActivityIndicator color="#F5A623" className="py-6" />
                ) : (
                  <SpendByProviderChart
                    transactions={transactions}
                    isDark={isDark}
                  />
                )}
              </Card>
            </View>

            {/* Recent Transactions List */}
            <RecentTransactions
              loading={transactionsLoading}
              transactions={transactions}
            />
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <FloatingSendButton />
      </View>
    </SafeAreaView>
  );
}