import { apiClient } from "./client";

export interface TransferQuote {
  senderWalletId: string;
  senderCurrency: string;
  recipientProvider: string;
  recipientNumber: string;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  fee: number;
  totalDeducted: number;
  recipientCurrency: string;
}

export interface Transaction {
  id: string;
  senderWalletId: string;
  recipientProvider: string;
  recipientNumber: string;
  amount: string;
  fee: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
  failureReason: string | null;
  providerReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  exchangeRate: {
    sourceCurrency: string;
    targetCurrency: string;
    rate: string;
  } | null;
}

export interface QuotePayload {
  senderWalletId: string;
  recipientProvider: string;
  amount: number;
}

export interface TransferPayload {
  senderWalletId: string;
  recipientProvider: string;
  recipientNumber: string;
  amount: number;
  description?: string;
}

export interface TransferResult {
  transactionId: string;
  status: string;
  providerReferenceId: string;
  quote: TransferQuote;
  message: string;
}

export const transactionApi = {
  getQuote: async (payload: QuotePayload): Promise<TransferQuote> => {
    const response = await apiClient.post("/transactions/quote", payload);
    return response.data.data;
  },

  initiateTransfer: async (
    payload: TransferPayload
  ): Promise<TransferResult> => {
    const response = await apiClient.post("/transactions", payload);
    return response.data.data;
  },

  list: async (walletId?: string): Promise<Transaction[]> => {
    const params = walletId ? { walletId } : {};
    const response = await apiClient.get("/transactions", { params });
    return response.data.data;
  },

  getById: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    return response.data.data;
  },
};