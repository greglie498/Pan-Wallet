// lib/store/auth.store.ts

import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import { useWalletStore } from "./wallet.store";
import { router } from "expo-router";

interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  loginWithPassword: (phoneNumber: string, password: string) => Promise<void>;
  registerWithPassword: (
    phoneNumber: string,
    name: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  // ── Initialize ─────────────────────────────────────────────────
  initialize: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        set({ isAuthenticated: true });
      }
    } catch {
      await tokenStorage.clearTokens();
      set({ isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  // ── Register ───────────────────────────────────────────────────
  registerWithPassword: async (phoneNumber, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.register({ phoneNumber, name, password });
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
          : "Registration failed. Please try again.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────────
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
      await tokenStorage.setTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
      console.log("ACCES TOKEN:", result.tokens.accessToken);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────
  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Continue with local logout even if server call fails
    } finally {
      await tokenStorage.clearTokens();
      useWalletStore.getState().reset();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      router.replace("/(auth)/welcome");
    }
  },

  clearError: () => set({ error: null }),
}));

export { useAuthStore };