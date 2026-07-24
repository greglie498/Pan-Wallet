import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { tokenStorage, setAuthFailureHandler } from "../api/client";
import { useWalletStore } from "./wallet.store";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const ADMIN_KEY = "panwallet_is_admin";
const ADMIN_DATA_KEY = "panwallet_admin_data";
const USER_DATA_KEY="panwallet_user_data";

interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email: string | null;
}

interface AdminData {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  adminData: AdminData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  adminData: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  isInitializing: true,
  error: null,

  // ── Initialize ─────────────────────────────────────────────────
  initialize: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        const isAdmin = await SecureStore.getItemAsync(ADMIN_KEY);
        const adminDataStr = await SecureStore.getItemAsync(ADMIN_DATA_KEY);
        const adminData = adminDataStr ? JSON.parse(adminDataStr) : null;
        const userDataStr = await SecureStore.getItemAsync(USER_DATA_KEY);
        const user = userDataStr ? JSON.parse(userDataStr) as User : null;
        set({
          user,
          isAuthenticated: true,
          isAdmin: isAdmin === "true",
          adminData,
        });
      }
    } catch {
      await tokenStorage.clearTokens();
      set({ isAuthenticated: false, isAdmin: false });
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
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(result.user));
      set({
        user: result.user,
        isAuthenticated: true,
        isAdmin: false,
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

  // ── User Login ─────────────────────────────────────────────────
  loginWithPassword: async (phoneNumber, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.login({ phoneNumber, password });
      await tokenStorage.setTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(result.user));
      await SecureStore.setItemAsync(ADMIN_KEY, "false");
      set({
        user: result.user,
        isAuthenticated: true,
        isAdmin: false,
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

  // ── Admin Login ────────────────────────────────────────────────
  adminLogin: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.adminLogin({ username, password });
      await tokenStorage.setTokens(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
      await SecureStore.setItemAsync(ADMIN_KEY, "true");
      await SecureStore.setItemAsync(
        ADMIN_DATA_KEY,
        JSON.stringify(result.admin)
      );
      set({
        adminData: result.admin,
        isAuthenticated: true,
        isAdmin: true,
        isLoading: false,
      });
      router.replace("/(app)/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Admin login failed. Please try again.";
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
      // Continue with local logout
    } finally {
      await tokenStorage.clearTokens();
      await SecureStore.deleteItemAsync(ADMIN_KEY);
      await SecureStore.deleteItemAsync(ADMIN_DATA_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      useWalletStore.getState().reset();
      set({
        user: null,
        adminData: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        error: null,
      });
      router.replace("/(auth)/welcome");
    }
  },

  clearError: () => set({ error: null }),
}));

setAuthFailureHandler(() => {
  useWalletStore.getState().reset();
  useAuthStore.setState({
    user: null,
    adminData: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    error: "Your session expired. Please sign in again.",
  });
  router.replace("/(auth)/welcome");
})

export { useAuthStore };