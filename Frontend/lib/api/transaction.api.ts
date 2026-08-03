import { apiClient } from "./client";
import { extractData } from "./utils";

export type Provider =
  | "MPESA"
  | "MTN_MOMO"
  | "PANWALLET_INTERNAL";

export interface TransferQuote {
  senderWalletId: string;
  senderCurrency: string;
  recipientProvider: Provider;
  recipientNumber: string;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  fee: number;
  totalDeducted: number;
  recipientCurrency: string;
}

export interface Transaction {
  type: string;
  currency: ReactNode;
  senderCurrency: ReactNode;
  id: string;
  senderWalletId: string;
  recipientProvider: Provider;
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
  recipientProvider: Provider;
  recipientNumber: string;
  amount: number;
}

export interface TransferPayload {
  senderWalletId: string;
  recipientProvider: string;
  recipientNumber: string;
  amount: number;

  quotedExchangeRate?: number;
  quotedConvertedAmount?: number;
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
    console.log("Quote payload:", JSON.stringify(payload));
    const response = await apiClient.post("/transactions/quote", payload);
    return extractData<TransferQuote>(response);
  },

  initiateTransfer: async (
    payload: TransferPayload
  ): Promise<TransferResult> => {
    const response = await apiClient.post("/transactions", payload);
    return extractData<TransferResult>(response);
  },

  list: async (walletId?: string): Promise<Transaction[]> => {
    const params = walletId ? { walletId } : {};
    const response = await apiClient.get("/transactions", { params });
    return extractData<Transaction[]>(response);
  },

  getById: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    return extractData<Transaction>(response);
  },
};