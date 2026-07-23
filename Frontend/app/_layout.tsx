import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";

// Keep splash screen visible while fonts load and auth initializes
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitializing } = useAuthStore();
  const { isDark, initialize: initTheme } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initialize();
    initTheme();
  }, []);

  useEffect(() => {
    if (!isInitializing && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing, fontsLoaded]);

  // Keep splash screen visible until both fonts and auth are ready
  if (isInitializing || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style= {isDark ? "light" : "dark" } />
      <View
        className={`flex-1 ${isDark ? "dark" : ""}`}
        style={{ flex: 1 }} 
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}