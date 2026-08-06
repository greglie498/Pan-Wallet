import { create } from "zustand";
import { walletApi, Wallet, LinkWalletPayload } from "@/lib/api/wallet.api";

interface WalletState {
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  topUpWallet: (walletId: string, amount: number) => Promise<void>;
  linkWallet: (payload: LinkWalletPayload) => Promise<void>;
  unlinkWallet: (walletId: string) => Promise<void>;
  reset: () => void; // Added reset interface
}

const initialState = {
  wallets: [],
  isLoading: false,
  error: null,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

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

  forceRefresh: async () => {
    await get().fetchWallets();
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
  
  reset: () => set({ wallets: [], isLoading: false, error: null }),
}));