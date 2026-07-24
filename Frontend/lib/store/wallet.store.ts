import { create } from "zustand";
import { walletApi, Wallet } from "../api/wallet.api";

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;

  fetchWallets: () => Promise<void>;
  linkWallet: (provider: "MPESA" | "MTN_MOMO", walletNumber: string) => Promise<void>;
  unlinkWallet: (walletId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const useWalletStore = create<WalletState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  wallets: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  // ── Fetch wallets ──────────────────────────────────────────────
  fetchWallets: async () => {
    // Skip if fetched in last 30 seconds
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched.getTime() < 30000) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const wallets = await walletApi.list();
      set({ wallets, isLoading: false, lastFetched: new Date() });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch wallets.";
      set({ error: message, isLoading: false });
    }
  },

  forceRefresh: async () => {
    set({ isLoading: true, error: null, lastFetched: null });
    try {
      const wallets = await walletApi.list();
      set({ wallets, isLoading: false, lastFetched: new Date() });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch wallets.";
      set({ error: message, isLoading: false });
    }
  },

  // ── Link wallet ────────────────────────────────────────────────
  linkWallet: async (provider, walletNumber) => {
    set({ isLoading: true, error: null });
    try {
      const newWallet = await walletApi.link({ provider, walletNumber });
      set((state) => ({
        wallets: [...state.wallets, newWallet],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to link wallet.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // ── Unlink wallet ──────────────────────────────────────────────
  unlinkWallet: async (walletId) => {
    set({ isLoading: true, error: null });
    try {
      await walletApi.unlink(walletId);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== walletId),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to unlink wallet.";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // ── Clear error ────────────────────────────────────────────────
  clearError: () => set({ error: null }),

  // ── Reset — called on logout ───────────────────────────────────
  reset: () =>
    set({
      wallets: [],
      isLoading: false,
      error: null,
      lastFetched: null,
    }),
}));

export { useWalletStore };