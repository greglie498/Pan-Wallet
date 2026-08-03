import React from "react";
import {
  StatusBar,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "@/components/ui";

const features = [
  {
    icon: "zap",
    title: "Instant Transfers",
    description: "Move money between African mobile money networks.",
  },
  {
    icon: "globe",
    title: "Pan-African",
    description: "Connect M-Pesa, MTN MoMo, Airtel Money and more.",
  },
  {
    icon: "shield",
    title: "Secure",
    description: "Protected authentication and encrypted transactions.",
  },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0A1628"
        />

        <View className="flex-1 px-6 justify-between py-8">

          {/* Hero */}

          <View className="items-center mt-6">

            <Image
              source={require("@/assets/images/panwallet-logo.png")}
              className="w-44 h-44 mb-6"
              resizeMode="contain"
            />

            <Text className="text-accent uppercase tracking-[4px] text-sm font-bold">
              ONE WALLET. EVERY NETWORK.
            </Text>

            <Text className="text-white text-5xl font-black text-center mt-3">
              Move Money{"\n"}Across Africa
            </Text>

            <Text className="text-slate-300 text-center text-base leading-7 mt-5 px-4">
              Connect M-Pesa, MTN MoMo, Airtel Money and Orange Money through one secure digital wallet.
            </Text>

          </View>

          {/* Features */}

          <View className="gap-4">

            {features.map((feature) => (

              <View
                key={feature.title}
                className="bg-primary-light rounded-3xl px-5 py-5 flex-row items-center"
              >

                <View className="w-12 h-12 rounded-2xl bg-accent items-center justify-center mr-4">

                  <Feather
                    name={feature.icon as any}
                    size={22}
                    color="#0A1628"
                  />

                </View>

                <View className="flex-1">

                  <Text className="text-white font-bold text-base">
                    {feature.title}
                  </Text>

                  <Text className="text-slate-400 mt-1 leading-5">
                    {feature.description}
                  </Text>

                </View>

              </View>

            ))}

          </View>

          {/* CTA */}
          <View className="mt-8">
            <Button
              title="Create Your Wallet"
              size="lg"
              rightIcon={
                <Feather
                  name="arrow-right"
                  size={18}
                  color="#0A1628"
                />
              }
              onPress={() =>
                router.push("/(auth)/register")
              }
            />

            <Button
              title="Sign In"
              variant="ghost"
              size="lg"
              onPress={() =>
                router.push("/(auth)/login")
              }
            />

            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() =>
                router.push("/(auth)/admin-login")
              }
            >
              <Text className="text-slate-400 text-sm">
                Are you an administrator?{" "}
                <Text className="text-accent font-semibold">
                  Admin Sign In
                </Text>
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-slate-500 text-xs mt-6">
              By continuing you agree to our{" "}
              <Text className="text-accent">
                Terms
              </Text>{" "}
              and{" "}
              <Text className="text-accent">
                Privacy Policy
              </Text>
            </Text>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}