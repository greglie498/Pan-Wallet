import { apiClient } from "./client";

export interface Wallet {
  id: string;
  userId: string;
  provider: "PANWALLET_INTERNAL" | "MPESA" | "MTN_MOMO";
  walletNumber: string;
  currency: string;
  balance: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export interface LinkWalletPayload {
  provider: "MPESA" | "MTN_MOMO";
  walletNumber: string;
}

export const walletApi = {
  list: async (): Promise<Wallet[]> => {
    const response = await apiClient.get("/wallets");
    return response.data.data;
  },

  getById: async (walletId: string): Promise<Wallet> => {
    const response = await apiClient.get(`/wallets/${walletId}`);
    return response.data.data;
  },

  link: async (payload: LinkWalletPayload): Promise<Wallet> => {
    const response = await apiClient.post("/wallets/link", payload);
    return response.data.data;
  },

  unlink: async (walletId: string): Promise<void> => {
    await apiClient.delete(`/wallets/${walletId}/unlink`);
  },
};