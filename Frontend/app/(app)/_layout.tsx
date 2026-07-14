import React from "react";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "@/lib/store";
import { Redirect } from "expo-router";

function TabIcon({
  emoji,
  focused,
}: {
  emoji: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center">
      <Text className={`text-xl ${focused ? "opacity-100" : "opacity-40"}`}>
        {emoji}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();

  // Guard — redirect to welcome if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0A1628",
          borderTopColor: "#1A2F50",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: "#F5A623",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets/index"
        options={{
          title: "Wallets",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💳" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets/link"
        options={{
          href: null, // Hide from tab bar — accessed via button
        }}
      />
      <Tabs.Screen
        name="transactions/quote"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions/confirm"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}