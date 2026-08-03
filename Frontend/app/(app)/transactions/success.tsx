import React from "react";
import { View, Text, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { useTheme } from "@/lib/store/theme.store";
import { Feather } from "@expo/vector-icons";

export default function SuccessScreen() {
  const { isDark } = useTheme();

  const params = useLocalSearchParams<{
    transactionId: string;
    amount: string;
    currency: string;
    recipient: string;
  }>();

  const formattedAmount = Number(params.amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />
      <View className="flex-1 px-6 justify-between py-10">
        <View className="items-center mt-12">
          {/* Animated Success Check Badge */}
          <View className="w-24 h-24 rounded-full bg-[#F5A623]/20 items-center justify-center border-2 border-[#F5A623]">
            <View className="w-16 h-16 rounded-full bg-[#F5A623] items-center justify-center shadow-md">
              <Feather name="check" size={36} color="#0A1628" />
            </View>
          </View>

          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="text-3xl font-bold mt-6 text-center"
          >
            Transfer Successful
          </Text>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-center text-sm mt-2"
          >
            Your money has been processed and sent
          </Text>

          {/* Amount Card */}
          <View
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderColor: isDark ? "#334155" : "#E2E8F0",
            }}
            className="mt-8 p-6 rounded-2xl border items-center w-full shadow-sm"
          >
            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              Amount sent
            </Text>
            <Text className="text-[#F5A623] text-4xl font-black mt-2">
              {params.currency ?? "USD"} {formattedAmount}
            </Text>

            {params.recipient && (
              <View
                style={{
                  backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                }}
                className="mt-4 px-4 py-2 rounded-full flex-row items-center"
              >
                <Feather
                  name="user"
                  size={14}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
                <Text
                  style={{ color: isDark ? "#E2E8F0" : "#334155" }}
                  className="text-xs font-semibold ml-2"
                >
                  To: {params.recipient}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full">
          <Button
            title="View Transaction Details"
            variant="primary"
            size="lg"
            onPress={() =>
              router.replace(
                `/(app)/transactions/${params.transactionId ?? ""}`
              )
            }
          />

          <View className="mt-3">
            <Button
              title="Back to Dashboard"
              variant="ghost"
              size="lg"
              onPress={() => router.replace("/(app)")}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}