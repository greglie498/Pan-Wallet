import { create } from "zustand";
import auth from "@react-native-firebase/auth";
import { useWalletStore } from "./wallet.store";
import { authApi, AuthResponse } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import { router } from "expo-router";

interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email: string | null;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  loginWithPassword: (phoneNumber: string, password: string) => Promise<void>;
  loginWithFirebase: (phoneNumber: string) => Promise<() => void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;

  // Internal
  _firebaseConfirmation: FirebaseConfirmation | null;
  _setUser: (user: User | null) => void;
}

// Firebase confirmation result type
interface FirebaseConfirmation {
  confirm: (code: string) => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  _firebaseConfirmation: null,

  _setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  // ── Initialize — check for existing tokens on app launch ───────
  initialize: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();

      if (accessToken) {
        // Tokens exist — user was previously logged in
        // The API client will use these tokens automatically
        // We don't store user data locally — fetch it on next API call
        set({ isAuthenticated: true });
      }
    } catch {
      await tokenStorage.clearTokens();
      set({ isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  // ── Password login (fallback path) ────────────────────────────
  loginWithPassword: async (phoneNumber, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login({ phoneNumber, password });
      await tokenStorage.setTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
      router.replace("/(app)/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Firebase OTP — Step 1: send OTP ───────────────────────────
  loginWithFirebase: async (phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

      set({
        _firebaseConfirmation: {
          confirm: async (code: string) => {
            await confirmation.confirm(code);
          },
        },
        isLoading: false,
      });

      router.push("/(auth)/otp");

      // Return unsubscribe function for auth state listener
      const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          try {
            const result = await authApi.firebaseLogin({ idToken });
            await tokenStorage.setTokens(
              result.tokens.accessToken,
              result.tokens.refreshToken
            );
            set({
              user: result.user,
              isAuthenticated: true,
            });
            router.replace("/(app)/dashboard");
          } catch (error) {
            set({ error: "Authentication failed. Please try again." });
          }
          unsubscribe();
        }
      });

      return unsubscribe;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.";
      set({ error: message, isLoading: false });
      return () => {};
    }
  },

  // ── Firebase OTP — Step 2: verify OTP ─────────────────────────
  verifyOtp: async (otp) => {
    set({ isLoading: true, error: null });
    const { _firebaseConfirmation } = get();

    if (!_firebaseConfirmation) {
      set({
        error: "OTP session expired. Please request a new code.",
        isLoading: false,
      });
      return;
    }

    try {
      await _firebaseConfirmation.confirm(otp);
      // onAuthStateChanged listener in loginWithFirebase handles
      // the backend call and navigation after this succeeds
      set({ isLoading: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid OTP. Please try again.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Logout ────────────────────────────────────────────────────
  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      await auth().signOut();
    } catch {
      // Continue with local logout even if server call fails
    } finally {
      await tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        _firebaseConfirmation: null,
      });
      router.replace("/(auth)/welcome");
    }
    useWalletStore.getState().reset();
  },

  // ── Clear error ───────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));

export { useAuthStore };