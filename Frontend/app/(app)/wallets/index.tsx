import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Input, Card } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useWalletStore } from "@/lib/store";
import { useTheme } from "@/lib/store/theme.store";
import { walletApi } from "@/lib/api/wallet.api";

type ProviderType = "MPESA" | "MTN_MOMO";

export default function WalletsScreen() {
  const { isDark } = useTheme();
  const { wallets, fetchWallets, isLoading } = useWalletStore();

  // Modals state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // Form Inputs
  const [topUpAmount, setTopUpAmount] = useState("");
  const [linkProvider, setLinkProvider] = useState<ProviderType>("MPESA");
  const [linkPhoneNumber, setLinkPhoneNumber] = useState("");

  // Loading & Error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const totalBalance = wallets.reduce(
    (acc, wallet) => acc + parseFloat(wallet.balance || "0"),
    0
  );

  const handleTopUp = async () => {
    if (!selectedWalletId) return;
    const amount = parseFloat(topUpAmount);

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage("Top-up amount must be greater than zero.");
      return;
    }

    if (amount > 10000) {
      setErrorMessage("Maximum top-up amount is $10,000 per transaction.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await walletApi.topUp(selectedWalletId, amount);
      await fetchWallets();
      setShowTopUpModal(false);
      setTopUpAmount("");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to top up wallet."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!linkPhoneNumber.trim()) {
      setErrorMessage("Please enter a valid phone or account number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await walletApi.linkWallet({
        provider: linkProvider,
        walletNumber: linkPhoneNumber.trim(),
      });
      await fetchWallets();
      setShowLinkModal(false);
      setLinkPhoneNumber("");
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to link wallet."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkWallet = (walletId: string, provider: string) => {
    if (provider === "PANWALLET_INTERNAL") {
      Alert.alert(
        "Action Restricted",
        "Your primary internal PanWallet cannot be unlinked."
      );
      return;
    }

    Alert.alert(
      "Unlink Wallet",
      `Are you sure you want to remove this ${provider} wallet?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            try {
              await walletApi.unlinkWallet(walletId);
              await fetchWallets();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.message || "Failed to unlink wallet."
              );
            }
          },
        },
      ]
    );
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "MPESA":
        return { label: "M-Pesa", bg: "bg-green-600", icon: "cellphone" };
      case "MTN_MOMO":
        return { label: "MTN MoMo", bg: "bg-yellow-500", icon: "wallet" };
      default:
        return { label: "PanWallet Internal", bg: "bg-blue-600", icon: "shield-check" };
    }
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: isDark ? "#0A1628" : "#F8FAFC" }}
      className="flex-1"
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0A1628" : "#F8FAFC"}
      />

      {/* Header */}
      <View
        style={{ borderBottomColor: isDark ? "#1E293B" : "#E2E8F0" }}
        className="px-6 pt-4 pb-6 border-b flex-row items-center justify-between"
      >
        <View>
          <Text
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="text-xs font-semibold uppercase tracking-wider"
          >
            Overview
          </Text>
          <Text
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            className="text-2xl font-bold"
          >
            My Wallets
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Total Balance Card */}
        <Card variant="elevated" padding="lg" className="mb-6 bg-indigo-900/40">
          <Text className="text-xs font-medium text-indigo-200 uppercase tracking-wider mb-1">
            Total Aggregate Balance
          </Text>
          <Text className="text-3xl font-extrabold text-white mb-4">
            ${totalBalance.toFixed(2)} USD
          </Text>

          <TouchableOpacity
            onPress={() => {
              setErrorMessage(null);
              setShowLinkModal(true);
            }}
            className="bg-amber-500 py-3 rounded-xl items-center flex-row justify-center"
            activeOpacity={0.8}
          >
            <Feather name="plus-circle" size={18} color="#0A1628" />
            <Text className="text-slate-950 font-bold ml-2 text-sm">
              Link New Provider Wallet
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Linked Wallets List */}
        <Text
          style={{ color: isDark ? "#94A3B8" : "#64748B" }}
          className="text-xs font-semibold mb-3 uppercase tracking-wider"
        >
          Linked Accounts ({wallets.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#F5A623" className="my-8" />
        ) : (
          wallets.map((wallet) => {
            const badge = getProviderBadge(wallet.provider);
            const isInternal = wallet.provider === "PANWALLET_INTERNAL";

            return (
              <View
                key={wallet.id}
                style={{
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                }}
                className="p-4 rounded-2xl border mb-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View
                    className={`w-10 h-10 rounded-xl ${badge.bg} items-center justify-center mr-3`}
                  >
                    <MaterialCommunityIcons
                      name={badge.icon as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                      className="font-bold text-sm"
                    >
                      {badge.label}
                    </Text>
                    <Text
                      style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                      className="text-xs"
                    >
                      {wallet.walletNumber || "Primary Wallet"}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text
                    style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    className="font-bold text-base"
                  >
                    {wallet.currency} {parseFloat(wallet.balance || "0").toFixed(2)}
                  </Text>

                  <View className="flex-row items-center mt-2 space-x-2">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedWalletId(wallet.id);
                        setErrorMessage(null);
                        setShowTopUpModal(true);
                      }}
                      className="bg-amber-500/20 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-amber-500 font-bold text-xs">
                        Top Up
                      </Text>
                    </TouchableOpacity>

                    {!isInternal && (
                      <TouchableOpacity
                        onPress={() =>
                          handleUnlinkWallet(wallet.id, wallet.provider)
                        }
                        className="bg-red-500/10 px-2 py-1 rounded-lg"
                      >
                        <Feather name="trash-2" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Top Up Modal */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ backgroundColor: isDark ? "#0A1628" : "#FFFFFF" }}
            className="p-6 rounded-t-3xl border-t border-slate-700/50"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-xl font-bold"
              >
                Top Up Wallet
              </Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)}>
                <Feather
                  name="x"
                  size={24}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            <Input
              label="Amount (USD)"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={topUpAmount}
              onChangeText={(text) => {
                setTopUpAmount(text);
                if (errorMessage) setErrorMessage(null);
              }}
              error={errorMessage || undefined}
            />

            <Button
              title="Confirm Top Up"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleTopUp}
              disabled={!topUpAmount || isSubmitting}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>

      {/* Link Wallet Modal */}
      <Modal visible={showLinkModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View
            style={{ backgroundColor: isDark ? "#0A1628" : "#FFFFFF" }}
            className="p-6 rounded-t-3xl border-t border-slate-700/50"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                className="text-xl font-bold"
              >
                Link Provider Wallet
              </Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Feather
                  name="x"
                  size={24}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              className="text-xs font-semibold mb-2 uppercase"
            >
              Select Provider
            </Text>
            <View className="flex-row space-x-3 mb-4">
              {(["MPESA", "MTN_MOMO"] as ProviderType[]).map((prov) => (
                <TouchableOpacity
                  key={prov}
                  onPress={() => setLinkProvider(prov)}
                  style={{
                    backgroundColor:
                      linkProvider === prov
                        ? "#F5A623"
                        : isDark
                        ? "#1E293B"
                        : "#F1F5F9",
                  }}
                  className="flex-1 py-3 rounded-xl items-center"
                >
                  <Text
                    style={{
                      color:
                        linkProvider === prov
                          ? "#0A1628"
                          : isDark
                          ? "#FFFFFF"
                          : "#0F172A",
                    }}
                    className="font-bold text-xs"
                  >
                    {prov === "MPESA" ? "M-Pesa" : "MTN MoMo"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Wallet / Mobile Number"
              placeholder="+254 7XX XXX XXX"
              keyboardType="phone-pad"
              value={linkPhoneNumber}
              onChangeText={(text) => {
                setLinkPhoneNumber(text);
                if (errorMessage) setErrorMessage(null);
              }}
              error={errorMessage || undefined}
            />

            <Button
              title="Link Wallet Account"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleLinkWallet}
              disabled={!linkPhoneNumber || isSubmitting}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}