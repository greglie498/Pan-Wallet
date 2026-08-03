import React from "react";
import { Tabs, Redirect } from "expo-router";
import { ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/store";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/lib/store/theme.store";

function TabIcon({
  name,
  color,
}: {
  name: keyof typeof Feather.glyphMap;
  color: ColorValue;
}) {
  return <Feather name={name} size={24} color={color} />;
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  console.log("APP TAB LAYOUT LOADED");
  const { adminData } = useAuthStore();
  const isAdmin = !!adminData;
  const { isDark } = useTheme();
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return null;
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5A623",
        tabBarInactiveTintColor: isDark ? "#94A3B8" : "#64748B",
        tabBarStyle: {
          backgroundColor: isDark ? "#0A1628" : "#FFFFFF",
          borderTopColor: isDark ? "#1E293B" : "#E2E8F0",
          borderTopWidth: 1,
          height: 65 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
          elevation: isDark ? 0 : 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="topup"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: "Wallets",
          tabBarIcon: ({ color }) => (
            <TabIcon name="credit-card" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <TabIcon name="clock" color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default tab behavior and navigate straight to history list index
            e.preventDefault();
            navigation.navigate("transactions", { screen: "index" });
          },
        })}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}