import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/component/ui";
import { useAuthStore } from "@/lib/store";

export default function OtpScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const { verifyOtp, loginWithFirebase, isLoading, error, clearError } =
    useAuthStore();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(
      () => setResendTimer((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullOtp = [...newOtp].join("");
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Go back to previous input on backspace
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    clearError();
    const otpCode = code ?? otp.join("");
    if (otpCode.length !== 6) return;
    await verifyOtp(otpCode);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    clearError();
    setOtp(["", "", "", "", "", ""]);
    setResendTimer(60);
    inputRefs.current[0]?.focus();
    // loginWithFirebase will re-send the OTP to the same number
    // stored in the auth store's confirmation object
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View className="flex-1 px-6 pt-4">
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center mb-8"
        >
          <Text className="text-white text-2xl">←</Text>
        </TouchableOpacity>

        <Text className="text-white text-3xl font-bold mb-2">
          Verify your{"\n"}number
        </Text>
        <Text className="text-gray-400 text-sm mb-12">
          Enter the 6-digit code we sent to your phone
        </Text>

        {/* OTP inputs */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              className={`w-12 h-14 rounded-xl text-center text-white text-xl font-bold border-2 ${
                digit
                  ? "border-accent bg-primary-light"
                  : "border-gray-700 bg-primary-light"
              }`}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Error message */}
        {error && (
          <View className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6">
            <Text className="text-red-400 text-sm text-center">
              {error}
            </Text>
          </View>
        )}

        {/* Verify button */}
        <Button
          title="Verify Code"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={otp.join("").length !== 6}
          onPress={() => handleVerify()}
        />

        {/* Resend */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-400 text-sm">
            Didn't receive the code?{" "}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0}
          >
            <Text
              className={`text-sm font-semibold ${
                resendTimer > 0 ? "text-gray-600" : "text-accent"
              }`}
            >
              {resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}