import React, { useEffect, useState, useCallback } from "react";
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
 import { BarChart, PieChart } from "react-native-gifted-charts";
 import { Card } from "@/components/ui";
 import { ThemeToggle } from "@/components/ThemeToggle";
 import { useAuthStore } from "@/lib/store";
 import { useTheme } from "@/lib/store/theme.store";
 import { adminApi, AdminStats } from "@/lib/api/admin.api";

 const { width: SCREEN_WIDTH } = Dimensions.get("window");
 const CHART_WIDTH = SCREEN_WIDTH - 64;

 export default function AdminDashboardScreen() {
    const { adminData, logout } = useAuthStore();
    const { isDark } = useTheme();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(true);

    const loadStats = useCallback( async () => {
        try {
            const data = await adminApi.getStats();
            setStats(data);
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const dailyBarData =
        stats?.dailyVolume.map((d) => ({
            value: Math.round(d.volume * 100) / 100,
            label: new Date(d.date).toLocaleDateString("eng-US", {
                weekday: "short",
            }),
            frontColor: "#F5A623",
            topLabelComponent: () =>
                d.volume > 0 ? (
                    <Text
                        style={{
                            fontSize: 8,
                            color: isDark ? "#9CA3AF" : "#94A3B8",
                        }}
                    >
                        ${d.volume.toFixed(0)}
                    </Text>
                ) : null,
        })) ?? [];

    const providerPieData = stats
        ? Object.entries(stats.transactionsByProvider).map(
            ([provider, count], i) => ({
                value: count,
                color: ["#F5A623", "#22C55E", "#3B82F6"][i % 3] ?? "#F5A623",
                text:
                    provider === "MPESA"
                        ? "M-Pesa"
                        : provider === "MTN_MOMO"
                        ? "MTN"
                        : "Internal",
            })
        )
        : [];

        return (
            <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
                <StatusBar
                    barStyle= "light-content"
                    backgroundColor={isDark ? "#111827" : "#0A1628"}
                />
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["F5A623"]}
                            tintColor="#F5A623"
                        />
                    }
                >
                    {/* Header */}
                    <View className="bg-primary dark:bg-gray-950 px-6 pt-4 pb-8">
                        <View className="flex-row justify-between items-center mb-6">
                            <View>
                                <Text className="text-gray-400 text-xs">Admin Panel</Text>
                                <Text className="text-white text-xl font-bold">
                                    {adminData?.username ?? "admin"} ⚙️
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

                        {/* Role Badge*/}
                        <View className="bg-accent/20 rounded-xl px-4 py-3 flex-row items-center">
                            <Text className="text-accent font-bold text-sm mr-2">
                                🔐{adminData?.role ?? "ADMIN"}
                            </Text>
                            <Text className="text-gray-400 text-xs">
                                Full system accesss
                            </Text>
                        </View>
                    </View>
                    <View className="px-6 -mt-4">
                        {isLoading ? (
                            <View className="text-gray-400 text-xs">
                                <ActivityIndicator color="#F5A623" size="large" />
                                <Text className="text-muted dark:text-gray-400 text-sm mt-3">
                                    Loading stats...
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* ------- Quick stats ---------------------- */}
                                <View className="flex-row flex-wrap -mx-2 mb-6">
                                    {[
                                        {
                                            label: "Total Users",
                                            value: stats?.totalUsers.toString() ?? "0",
                                            emoji: "👥",
                                            color: "bg-blue-500",
                                        },
                                        {
                                            label: "Transactions",
                                            value: stats?.totalTransactions.toString() ?? "0",
                                            emoji: "💸",
                                            color: "bg-purple-500",
                                        },
                                    ].map((stat) => (
                                        <View
                                            key={stat.label}
                                            className="w-1/2 px-2 mb-4"
                                        >

                                            <Card variant="elevated" padding="md">
                                                <View
                                                    className={`w-10 h-10 rounded-xl ${stat.color} items-center justify-center mb-3`}
                                                >
                                                    <Text className="text-xl">{stat.emoji}</Text>
                                                </View>
                                                <Text className="text-primary dark:text-white font-bold text-2xl">
                                                    {stat.value}
                                                </Text>
                                                <Text className="text-muted dark:text-gray-400 text-xs mt-1">
                                                    {stat.label}
                                                </Text>
                                            </Card>
                                        </View>
                                    ))}
                                </View>

                                {/* --------- Daily Volume chart------------------------------- */}
                                <View className="mb-6">
                                    <Card variant="elevated" padding="lg">
                                        <Text className="text-primary dark:text-white font-bold text-base mb-4">
                                            📈 Daily Volume (7 days)
                                        </Text>
                                        {dailyBarData.length > 0 ? (
                                            <BarChart
                                                data={dailyBarData}
                                                width={CHART_WIDTH - 40}
                                                height={140}
                                                barWidth={30}
                                                spacing={12}
                                                roundedTop
                                                hideRules
                                                xAxisThickness={0}
                                                yAxisThickness={0}
                                                yAxisTextStyle={{
                                                    color: isDark ? "#9CA3AF" : "#94A3B8",
                                                    fontSize: 10,
                                                }}
                                                xAxisLabelTextStyle= {{
                                                    color: isDark ? "#9CA3AF" : "#94A3B8",
                                                    fontSize: 10,
                                                }}
                                                noOfSections={3}
                                                maxValue={
                                                    Math.max(
                                                        ...dailyBarData.map((d) => d.value),
                                                        10
                                                    )
                                                }
                                            />
                                        ) : (
                                            <View className="items-center py-8">
                                                <Text className="text-muted dark:text-gray-400 text-sm">
                                                    No data yet
                                                </Text>
                                            </View>
                                        )}
                                    </Card>
                                </View>

                                {/* ------ Transactions status breakdown*/}
                                <View className="mb-6">
                                    <Card variant="elevated" padding="lg">
                                        <Text className="text-primary dark:text-white font-bold text-base mb-4">
                                            📋 Transaction Status
                                        </Text>
                                        {Object.entries(
                                            stats?.transactionsByStatus ?? {}
                                        ).map(([status, count]) => {
                                            const total = stats?.totalTransactions ?? 1;
                                            const pct = Math.round((count / total) * 100);
                                            const colors: Record<string, string> = {
                                                COMPLETED: "#22C55E",
                                                FAILED: "#EF4444",
                                                PENDING: "#3B82F6",
                                                REVERSED: "#F59E0B",
                                            };
                                            return (
                                                <View key={status} className="mb-3">
                                                    <View className="flex-row justify-between mb-1">
                                                        <Text className="text-primary dark:text-gray-400 text-sm font-medium">
                                                            {status}
                                                        </Text>
                                                        <Text className="text-muted darl:text-gray-400 text-sm">
                                                            {count} ({pct}%)
                                                        </Text>
                                                    </View>
                                                    <View className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                                        <View
                                                            className="h-2 rounded-full"
                                                            style={{
                                                                width: `${pct}%`,
                                                                backgroundColor:
                                                                    colors[status] ?? "#F5A623",
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </Card>
                                </View>

                                {/*----------- Provider breakdown pie chart ----------------------*/}
                                {providerPieData.length > 0 && (
                                    <View className="mb-6">
                                        <Card variant="elevated" padding="lg">
                                            <Text className="text-primary dark:text-white font-bold text-base mb-4">
                                                🍩 By Provider
                                            </Text>
                                            <View className="items-center">
                                                <PieChart
                                                    data={providerPieData}
                                                    donut
                                                    radius={80}
                                                    innerRadius={55}
                                                    centerLabelComponent={() => (
                                                        <Text className="text-primary dark:text-white font-bold text-xs text-center">
                                                            Providers
                                                        </Text>
                                                    )}
                                                />
                                                <View className="flex-row flex-wrap justify-center mt-4">
                                                    {providerPieData.map((item) => (
                                                        <View
                                                            key={item.text}
                                                            className="flex-row items-center mr-4 mb-2"
                                                        >
                                                            <View 
                                                                className="w-3 h-3 rounded-full mr-1"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <Text className="text-muted dark-gray-400 text-xs">
                                                                {item.text} : {item.value}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        </Card>
                                    </View>
                                )}

                                {/*---------- Quick Navigation-----------------------------------------------*/}
                                <View className="mb-8">
                                    <Text className="text-primary dark:text-white font-bold text-base mb-4">
                                        Quick Access
                                    </Text>
                                    <View className="flex-row -mx-2">
                                        <TouchableOpacity
                                            className="flex-1 mx-2"
                                            onPress={() =>
                                                router.push("/(app)/admin/users" as any)
                                            }
                                        >
                                            <Card variant="elevated" padding="md">
                                                <Text className="text-2xl mb-2">👥</Text>
                                                <Text className="text-primary dark:text-white font-bold">
                                                    Users
                                                </Text>
                                                <Text className="text-muted dark:text-gray-400 text-xs">
                                                    {stats?.totalUsers ?? 0} registered
                                                </Text>
                                            </Card>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 mx-2"
                                            onPress={() =>
                                                router.push("/(app)/admin/transactions" as any)
                                            }
                                        >
                                            <Card variant="elevated" padding="md">
                                                <Text className="text-2xl mb-2">💸</Text>
                                                <Text className="text-primary dark:text-gray-400 text-xs">
                                                    Transactions
                                                </Text>
                                                <Text className="text-muted dark:text-gray-400 text-xs">
                                                    {stats?.totalTransactions ?? 0} total
                                                </Text>
                                            </Card>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
 }