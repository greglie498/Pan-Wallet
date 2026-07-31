import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/lib/store";
import PhoneInput from "@/components/auth/PhoneInput";
import AuthFooter from "@/components/auth/AuthFooter";

const COUNTRY_CODES = [
  { code: "+254", flag: "🇰🇪", country: "Kenya" },
  { code: "+256", flag: "🇺🇬", country: "Uganda" },
  { code: "+250", flag: "🇷🇼", country: "Rwanda" },
  { code: "+233", flag: "🇬🇭", country: "Ghana" },
  { code: "+260", flag: "🇿🇲", country: "Zambia" },
  { code: "+221", flag: "🇸🇳", country: "Senegal" },
];
type Mode = "login" | "register" | "admin";

export default function RegisterScreen() {
  const mode: Mode = "register";
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]!);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const {  registerWithPassword,  isLoading, error, clearError } =
    useAuthStore();

    const validate = (): boolean => {
        const cleaned = phoneNumber.replace(/\D/g, "");

        if (name.trim().length < 2) {
            setValidationError("Enter your full name.");
            return false;
        }

        if (cleaned.length < 9) {
            setValidationError("Enter a valid phone number.");
            return false;
        }

        if (password.length < 8) {
            setValidationError("Password must be at least 8 characters.");
            return false;
        }

        if (password !== confirmPassword) {
            setValidationError("Passwords do not match.");
            return false;
        }

        setValidationError("");
        return true;
    };

    const handleSubmit = async () => {
        clearError();

        if (!validate()) return;

        const fullNumber = `${selectedCode.code}${phoneNumber.replace(/\D/g, "")}`;

        await registerWithPassword(
            fullNumber,
            name.trim(),
            password
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-primary">
        <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            >
            {/* Header */}
            <View className="px-6 pt-4 pb-6">
               <Image
                    source={require("@/assets/images/panwallet-logo-dark.png")}
                    className="w-24 h-24 self-center mb-6"
                    resizeMode="contain"
                />

                <Text className="text-white text-3xl font-bold text-center">
                    Create Your Wallet
                </Text>

                <Text className="text-slate-400 text-center mt-3 leading-6">
                    Join thousands of users sending money across Africa securely.
                </Text>
            </View>

            <View className="px-6 flex-1">
                {/* Name field — register only */}
                {mode === "register" && (
                <Input
                    label="Full Name"
                    placeholder="Jane Wanjiru"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />
                )}

                {/* Phone number */}
                <PhoneInput
                    selectedCountry={selectedCode}
                    onCountryChange={setSelectedCode}
                    phoneNumber={phoneNumber}
                    onPhoneChange={(text) => {
                        setPhoneNumber(text);
                        setValidationError("");
                    }}
                    leftIcon={
                        <Feather
                            name="phone"
                            size={18}
                            color="#94A3B8"
                        />
                    }
                />

                {/* Password */}
                 <Input
                    label="Confirm Password"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    rightIcon={
                        <Feather
                            name={showConfirmPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#94A3B8"
                        />
                    }
                    onRightIconPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                    }
                    leftIcon={
                        <Feather
                            name="lock"
                            size={18}
                            color="#94A3B8"
                        />
                    }
                />

                {/* Confirm password — register only */}
                {mode === "register" && (
                <Input
                    label="Confirm Password"
                    placeholder="Re-enter password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                )}

                {/* Error */}
                {(validationError || error) && (
                <View className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-4">
                    <Text className="text-red-400 text-sm">
                    {validationError || error}
                    </Text>
                </View>
                )}

                <Button
                    title="Create Your Wallet"
                    size="lg"
                    loading={isLoading}
                    rightIcon={
                        <Feather
                            name="arrow-right"
                            size={18}
                            color="#0A1628"
                        />
                    }
                    onPress={handleSubmit}
                />
                <AuthFooter
                    text="Already have an account?"
                    action="Sign In"
                    onPress={() => router.replace("/(auth)/login")}
                />
            </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}