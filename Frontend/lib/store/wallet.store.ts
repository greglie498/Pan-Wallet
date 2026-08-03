import { create } from "zustand";
import { walletApi, Wallet, LinkWalletPayload } from "@/lib/api/wallet.api";

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  topUpWallet: (walletId: string, amount: number) => Promise<void>;
  linkWallet: (payload: LinkWalletPayload) => Promise<void>;
  unlinkWallet: (walletId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  isLoading: false,
  error: null,

  fetchWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await walletApi.list();
      set({ wallets: data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch wallets",
        isLoading: false,
      });
    }
  },

  topUpWallet: async (walletId: string, amount: number) => {
    await walletApi.topUp(walletId, amount);
    await get().fetchWallets();
  },

  linkWallet: async (payload: LinkWalletPayload) => {
    await walletApi.link(payload);
    await get().fetchWallets();
  },

  unlinkWallet: async (walletId: string) => {
    await walletApi.unlink(walletId);
    await get().fetchWallets();
  },
}));