import React from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";

const { height } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Hero section */}
      <View
        className="items-center justify-center px-8"
        style={{ height: height * 0.55 }}
      >
        {/* Logo placeholder — replace with actual logo asset */}
        <View className="w-24 h-24 rounded-3xl bg-accent items-center justify-center mb-8">
          <Text className="text-primary text-4xl font-bold">P</Text>
        </View>

        <Text className="text-white text-4xl font-bold text-center mb-3">
          PanWallet
        </Text>

        <Text className="text-accent text-base text-center mb-4">
          Pan-African Mobile Money
        </Text>

        <Text className="text-gray-400 text-sm text-center leading-6">
          Send money across M-Pesa and MTN MoMo{"\n"}
          instantly, with live exchange rates.
        </Text>
      </View>

      {/* Feature highlights */}
      <View className="px-8 mb-8">
        {[
          { icon: "🌍", text: "Cross-network transfers" },
          { icon: "⚡", text: "Real-time exchange rates" },
          { icon: "🔒", text: "Bank-level security" },
        ].map((feature) => (
          <View
            key={feature.text}
            className="flex-row items-center mb-4"
          >
            <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center mr-4">
              <Text className="text-lg">{feature.icon}</Text>
            </View>
            <Text className="text-gray-300 text-sm font-medium">
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA buttons */}
      <View className="px-8 pb-8">
        <Button
          title="Get Started"
          variant="primary"
          size="lg"
          onPress={() => router.push("/(auth)/phone")}
        />

        <View className="mt-4">
          <Button
            title="I already have an account"
            variant="ghost"
            size="md"
            onPress={() => router.push("/(auth)/phone")}
          />
        </View>

        <Text className="text-gray-500 text-xs text-center mt-6">
          By continuing, you agree to our Terms of Service{"\n"}
          and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}