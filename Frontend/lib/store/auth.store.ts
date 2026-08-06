import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { setAuthFailureHandler } from "../api/client";
import { tokenStorage, adminTokenStorage } from "@/lib/storage/token.storage";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const ADMIN_KEY = "panwallet_is_admin";
const ADMIN_DATA_KEY = "panwallet_admin_data";
const USER_DATA_KEY = "panwallet_user_data";

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
  fetchProfile: () => Promise<void>;
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
      const userToken = await tokenStorage.getAccessToken();
      const adminToken = await adminTokenStorage.getAccessToken();

      const userDataStr = await SecureStore.getItemAsync(USER_DATA_KEY);

      if (adminToken) {
        const adminDataStr = await SecureStore.getItemAsync(ADMIN_DATA_KEY);
        set({
          isAuthenticated: true,
          isAdmin: true,
          adminData: adminDataStr ? (JSON.parse(adminDataStr) as AdminData) : null,
          user: null,
        });
        return;
      }

      if (!userToken) {
        set({
          isAuthenticated: false,
          user: userDataStr ? (JSON.parse(userDataStr) as User) : null,
          adminData: null,
          isAdmin: false,
        });
        return;
      }

      set({
        isAuthenticated: true,
        isAdmin: false,
        user: null,
        adminData: null,
      });
    } catch (error) {
      console.log(error);
      await tokenStorage.clearTokens();
      await adminTokenStorage.clearTokens();
      set({
        isAuthenticated: false,
        user: null,
        adminData: null,
        isAdmin: false,
      });
    } finally {
      set({
        isInitializing: false,
      });
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
      await adminTokenStorage.setTokens(
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
  
  fetchProfile: async () => {
    try {
      const user = await authApi.getProfile();
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      set({ user });
    } catch {
      // dashboard already swallows this with .catch(() => {}); nothing to do here
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

      const { useWalletStore } = await import("./wallet.store");
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

setAuthFailureHandler(async () => {
  const { useWalletStore } = await import("./wallet.store");
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
});

export { useAuthStore };