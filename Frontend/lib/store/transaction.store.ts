import { create } from "zustand";
import { Transaction, transactionApi } from "@/lib/api/transaction.api";

interface TransactionState {
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  fetchTransactionById: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  selectedTransaction: null,
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await transactionApi.list();
      set({ transactions: data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch transactions",
        isLoading: false,
      });
    }
  },

  fetchTransactionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await transactionApi.getById(id);
      set({ selectedTransaction: data, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to load transaction detail",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));