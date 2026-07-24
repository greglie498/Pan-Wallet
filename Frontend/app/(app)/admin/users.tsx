import React, { useEffect, useState, useCallback } from "react";
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
import { Card, Badge } from "@/components/ui";
import { useTheme } from "@/lib/store/theme.store";
import { adminApi, AdminUser } from "@/lib/api/admin.api";

export default function AdminUsersScreen() {
    const { isDark } = useTheme();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);

    const loadUsers = useCallback(async () => {
        try {
            const data = await adminApi.getUsers(1,50);
            setUsers(DataTransfer.users);
            setTotal(DataTransfer.total);
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    };

    return (
    <SafeAreaView className="flex-1 bg-surface dark:bg-gray-900">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#111827" : "#F8FAFC"}
      />

      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-gray-100 dark:border-gray-700 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mr-4"
        >
          <Text className="text-primary dark:text-white text-2xl">←</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-primary dark:text-white text-xl font-bold">
            Users
          </Text>
          <Text className="text-muted dark:text-gray-400 text-xs">
            {total} registered
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
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
        {isLoading ? (
          <ActivityIndicator color="#F5A623" className="mt-8" />
        ) : (
          users.map((user) => (
            <Card
              key={user.id}
              variant="default"
              padding="md"
              className="mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
                  <Text className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-primary dark:text-white font-bold text-sm">
                    {user.name}
                  </Text>
                  <Text className="text-muted dark:text-gray-400 text-xs">
                    {user.phoneNumber}
                  </Text>
                  {user.email && (
                    <Text className="text-muted dark:text-gray-400 text-xs">
                      {user.email}
                    </Text>
                  )}
                </View>
                <View className="items-end">
                  <Badge
                    label={user.status}
                    variant={user.status === "ACTIVE" ? "success" : "error"}
                    size="sm"
                  />
                  <Text className="text-muted dark:text-gray-400 text-xs mt-1">
                    {user._count.wallets} wallet
                    {user._count.wallets !== 1 ? "s" : ""}
                  </Text>
                  <Text className="text-muted dark:text-gray-400 text-xs">
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
        <View className="mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}