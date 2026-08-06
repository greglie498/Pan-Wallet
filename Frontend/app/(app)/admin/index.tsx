import {
View,
ScrollView,
RefreshControl,
StatusBar,
ActivityIndicator,
TextInput,
Dimensions
} from "react-native";
import {
useEffect,
useState,
useCallback
} from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
adminApi,
AdminStats
} from "@/lib/api/admin.api";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAdminStore } from "@/lib/store/admin.store";
import AdminStatCard from "@/components/admin/AdminStatCard";
import QuickAccessCard from "@/components/admin/QuickAccessCard";
import TransactionStatusCard from "@/components/admin/TransactionStatusCard";
import DailyVolumeCard from "@/components/admin/DailyVolumeCard";
import ProviderCard from "@/components/admin/ProviderCard";

const screenWidth = Dimensions.get("window").width;

export default function AdminDashboardScreen(){
    const { logout }= useAdminStore();
    const [stats,setStats]=useState<AdminStats|null>(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState("");

    const loadStats=useCallback(async()=>{
        try{
            const result =
            await adminApi.getStats();
            setStats(result);
            setError("");

        } catch(error){
            console.log(error);
            setError("Unable to load dashboard stats");
        } finally{
            setLoading(false);
        }

    },[]);

    useEffect(()=>{
        loadStats();
    },[]);

    if(loading){
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator/>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar barStyle="light-content" />
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadStats} />
                }
            >
                <AdminHeader logout={logout} />
                <View className="-mt-5 px-6">
                    <View className="flex-row flex-wrap">
                        <AdminStatCard
                            emoji="👥"
                            label="Total Users"
                            value={String(stats?.totalUsers ?? 0)}
                            color="bg-blue-500"
                        />

                        <AdminStatCard
                            emoji="💸"
                            label="Transactions"
                            value={String(stats?.totalTransactions ?? 0)}
                            color="bg-purple-500"
                        />

                        <AdminStatCard
                            emoji="💰"
                            label="Volume"
                            value={`$${(stats?.totalVolume ?? 0).toFixed(0)}`}
                            color="bg-green-500"
                        />

                        <AdminStatCard
                            emoji="✅"
                            label="Success"
                            value={`${(stats?.successRate ?? 0).toFixed(0)}%`}
                            color="bg-orange-500"
                        />
                    </View>

                    <View className="flex-row gap-3 mt-6">
                        <QuickAccessCard
                            emoji="👥"
                            title="Users"
                            description="View all accounts"
                            onPress={() => router.push("/(app)/admin/users")}
                        />
                        <QuickAccessCard
                            emoji="💸"
                            title="Transactions"
                            description="Monitor transfers"
                            onPress={() => router.push("/(app)/admin/transactions")}
                        />
                    </View>

                    {error ? null : (
                        <>
                            <View className="mt-6">
                                <TransactionStatusCard
                                    data={stats?.transactionsByStatus ?? {}}
                                    total={stats?.totalTransactions ?? 0}
                                />
                            </View>

                            <View className="mt-6">
                                <DailyVolumeCard
                                    data={(stats?.dailyVolume ?? []).map((d) => ({
                                        value: d.volume,
                                        label: d.date.slice(5), // "MM-DD"
                                    }))}
                                    width={screenWidth - 80}
                                />
                            </View>

                            <View className="mt-6 mb-8">
                                <ProviderCard
                                    data={Object.entries(stats?.transactionsByProvider ?? {}).map(
                                        ([provider, count]) => ({ value: count, text: provider })
                                    )}
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}