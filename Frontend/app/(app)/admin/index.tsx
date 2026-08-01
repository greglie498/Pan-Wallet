import React, { useCallback, useEffect, useState } from "react";
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
import {
  BarChart,
  PieChart,
} from "react-native-gifted-charts";
import { Card } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { adminApi, AdminStats } from "@/lib/api/admin.api";


const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 64;

// --------------------------------------------------
// KPI CARD COMPONENT
// --------------------------------------------------
function StatCard({
    emoji,
    label,
    value,
    color,
}: {
    emoji: string;
    label: string;
    value: string;
    color: string;
}) {
  return (
    <View className="w-1/2 px-2 mb-4">

        <Card
            variant="elevated"
            padding="md"
        >
            <View
            className={`w-11 h-11 rounded-2xl ${color} items-center justify-center mb-3`}
            >
            <Text className="text-xl">
                {emoji}
            </Text>
            </View>

            <Text className="text-primary dark:text-white text-2xl font-black">
            {value}
            </Text>

            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {label}
            </Text>

        </Card>

    </View>
  );
}



// --------------------------------------------------
// STATUS BAR COMPONENT
// --------------------------------------------------

function StatusProgress({
    status,
    count,
    total,
}: {
    status:string;
    count:number;
    total:number;
}) {

        const percentage =
            total === 0
            ? 0
            : Math.round((count / total) * 100);

        const statusColors:Record<string,string> = {
            COMPLETED:"#22C55E",
            FAILED:"#EF4444",
            PENDING:"#3B82F6",
            REVERSED:"#F59E0B",
        };


    return (

        <View className="mb-4">
            <View className="flex-row justify-between mb-2">
                <Text className="text-primary dark:text-white font-medium">
                    {status}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {count} ({percentage}%)
                </Text>
            </View>
            <View className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <View
                    className="h-2 rounded-full"
                    style={{
                        width:`${percentage}%`,
                        backgroundColor:
                        statusColors[status] ?? "#F5A623",
                    }}
                />
            </View>
        </View>

    );
}

// --------------------------------------------------
// MAIN SCREEN
// --------------------------------------------------
export default function AdminDashboardScreen(){
    const {
        adminData,
        logout,
    } = useAuthStore();

    const {
        isDark,
    } = useTheme();

    const [
        stats,
        setStats,
    ] = useState<AdminStats | null>(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const loadStats = useCallback(
        async()=>{
            try{

                const response =
                await adminApi.getStats();


                setStats(response);


            }catch(error){

                console.log(
                "Failed loading admin stats",
                error
                );

            }
            finally{

                setLoading(false);

            }
        },[]
    );

    useEffect(()=>{
        loadStats();
    },[]);

    const refresh = async()=>{
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const dailyVolume =
        stats?.dailyVolume.map(item=>({
        value:
            Math.round(item.volume),
        label:
            new Date(item.date)
            .toLocaleDateString(
                "en-US",
                {
                weekday:"short",
                }
            ),
        })) ?? [];
    const providerData =
        stats
        ?
        Object.entries(
        stats.transactionsByProvider
        ).map(([provider,count])=>({
        value:count,
        text:
            provider==="MPESA"
            ?
            "M-Pesa"
            :
            provider==="MTN_MOMO"
            ?
            "MTN MoMo"
            :
            "Internal",
        }))
        :
        [];

  if(loading){
    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color="#F5A623" />
                <Text className="mt-3 text-gray-500">
                    Loading dashboard...
                </Text>
            </SafeAreaView>
        );
    }
        
    }

    return (

            <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">

            <StatusBar
                barStyle="light-content"
                backgroundColor={
                isDark
                ? "#111827"
                : "#0A1628"
                }
            />
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                />
                }
            >
                {/* ================= HEADER ================= */}

                <View className="bg-primary px-6 pt-5 pb-10">
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-gray-400 text-xs">
                                Admin Panel
                            </Text>
                            <Text className="text-white text-2xl font-black mt-1">
                                {adminData?.username ?? "Administrator"}
                            </Text>
                            <View className="mt-3 bg-accent/20 rounded-xl px-3 py-2">
                                <Text className="text-accent text-xs font-bold">
                                    🔐 {adminData?.role ?? "ADMIN"}
                                </Text>
                            </View>
                        </View>

                    <TouchableOpacity
                    onPress={logout}
                    className="w-11 h-11 rounded-full bg-white/10 items-center justify-center"
                    >
                    <Text className="text-white text-xl">
                        ↩
                    </Text>
                    </TouchableOpacity>
                </View>
                </View>

                <View className="px-6 -mt-5">
                {/* ================= KPI CARDS ================= */}
                <View className="flex-row flex-wrap">
                    <StatCard
                    emoji="👥"
                    label="Total Users"
                    value={
                        String(
                        stats?.totalUsers ?? 0
                        )
                    }
                    color="bg-blue-500"
                    />

                    <StatCard
                    emoji="💸"
                    label="Transactions"
                    value={
                        String(
                        stats?.totalTransactions ?? 0
                        )
                    }
                    color="bg-purple-500"
                    />
                    <StatCard
                    emoji="💰"
                    label="Total Volume"
                    value={
                        `$${(
                        stats?.totalVolume ?? 0
                        ).toFixed(0)}`
                    }
                    color="bg-green-500"
                    />

                    <StatCard
                    emoji="✅"
                    label="Success Rate"
                    value={
                        `${(
                        stats?.successRate ?? 0
                        ).toFixed(0)}%`
                    }
                    color="bg-orange-500"

                    />
                </View>

                {/* ================= QUICK ACCESS ================= */}

                <Text className="text-primary dark:text-white text-lg font-bold mb-4">
                    Quick Access
                </Text>

                <View className="flex-row mb-6">
                        <TouchableOpacity
                            className="flex-1 mr-2"
                            onPress={()=>
                                router.push(
                                "/(app)/admin/users" as any
                                )
                            }
                            >
                            <Card
                                variant="elevated"
                                padding="lg"
                            >
                                <Text className="text-3xl mb-3">
                                    👥
                                </Text>
                                <Text className="text-primary dark:text-white font-bold">
                                    Users
                                </Text>
                                <Text className="text-gray-500 text-xs mt-1">
                                    Manage accounts
                                </Text>
                            </Card>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 ml-2"
                            onPress={()=>
                                router.push(
                                "/(app)/admin/transactions" as any
                                )
                            }
                            >
                            <Card
                                variant="elevated"
                                padding="lg"
                            >
                                <Text className="text-3xl mb-3">
                                    💸
                                </Text>
                                <Text className="text-primary dark:text-white font-bold">
                                    Transactions
                                </Text>
                                <Text className="text-gray-500 text-xs mt-1">
                                    Review transfers
                                </Text>
                            </Card>
                        </TouchableOpacity>
                    </View>

                {/* ================= STATUS ================= */}
                    <Card
                        variant="elevated"
                        padding="lg"
                    >
                        <Text className="text-primary dark:text-white font-bold text-lg mb-5">
                        📋 Transaction Status
                        </Text>
                        {
                            Object.entries(
                                stats?.transactionsByStatus ?? {}
                            )
                            .map(
                                ([status,count])=>(
                                <StatusProgress
                                    key={status}
                                    status={status}
                                    count={count}
                                    total={
                                    stats?.totalTransactions ?? 0
                                    }

                                />

                                )
                            )
                        }
                    </Card>

                {/* ================= DAILY VOLUME ================= */}

                    <View className="mt-6">
                        <Card
                        variant="elevated"
                        padding="lg"
                        >
                            <Text className="text-primary dark:text-white font-bold text-lg mb-5">
                                📈 Daily Volume
                            </Text>
                            {
                                dailyVolume.length > 0 ?
                                <BarChart
                                data={dailyVolume}
                                width={
                                    CHART_WIDTH - 40
                                }
                                height={170}
                                barWidth={25}
                                spacing={15}
                                roundedTop
                                hideRules
                                />
                                :
                                <Text className="text-gray-500 text-center py-8">
                                    No volume data yet
                                </Text>
                            }
                        </Card>
                    </View>

                {/* ================= PROVIDERS ================= */}
                    <View className="mt-6 mb-10">
                        <Card
                        variant="elevated"
                        padding="lg"
                        >
                            <Text className="text-primary dark:text-white font-bold text-lg mb-5">
                                🌍 Providers
                            </Text>
                            {
                                providerData.length === 1 ?
                                <View className="items-center py-6">
                                <Text className="text-4xl">
                                    📱
                                </Text>
                                <Text className="text-primary dark:text-white font-bold text-xl mt-3">
                                    {providerData[0].text}
                                </Text>
                                <Text className="text-gray-500 mt-2">
                                    100% of transactions
                                </Text>
                                </View>
                                :
                                <PieChart
                                    data={
                                        providerData.map(
                                        item=>({
                                            ...item,
                                            color:
                                            undefined
                                        })
                                        )
                                    }
                                    donut
                                    radius={80}
                                    innerRadius={55}
                                    centerLabelComponent={()=>(
                                        <Text className="font-bold">
                                            Providers
                                        </Text>
                                    )}
                                />
                            }
                        </Card>
                    </View>
                </View>
            </ScrollView>
            </SafeAreaView>
        );
}