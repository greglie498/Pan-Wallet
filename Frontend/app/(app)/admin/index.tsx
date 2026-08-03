import {
View,
ScrollView,
RefreshControl,
StatusBar,
ActivityIndicator,
TextInput
} from "react-native";
import {
useEffect,
useState,
useCallback
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
adminApi,
AdminStats
} from "@/lib/api/admin.api";
import { useAuthStore } from "@/lib/store";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAdminStore } from "@/lib/store/admin.store";
import AdminStatCard from "@/components/admin/AdminStatCard";
import QuickAccessCard from "@/components/admin/QuickAccessCard";
import TransactionStatusCard from "@/components/admin/TransactionStatusCard";
import DailyVolumeCard from "@/components/admin/DailyVolumeCard";
import ProviderCard from "@/components/admin/ProviderCard";


export default function AdminDashboardScreen(){
    const { logout }= useAdminStore();
    const [stats,setStats]=useState<AdminStats|null>(null);
    const [loading,setLoading]=useState(true);
    const loadStats=useCallback(async()=>{
        try{
            const result =
            await adminApi.getStats();
            setStats(result);

        } catch(error){
            console.log(error);
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
            <ScrollView>
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
                            value={`$${stats?.totalVolume.toFixed(0)}`}
                            color="bg-green-500"
                        />

                        <AdminStatCard
                            emoji="✅"
                            label="Success"
                            value={`${stats?.successRate.toFixed(0)}%`}
                            color="bg-orange-500"
                        />

                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>

    )

}