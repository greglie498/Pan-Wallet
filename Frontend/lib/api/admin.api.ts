import { adminClient } from "./admin.client";

export interface AdminStats {
    totalUsers: number;
    totalTransactions: number;
    totalVolume: number;
    successRate: number;
    transactionsByStatus: Record<string, number>;
    transactionsByProvider: Record<string, number>;
    dailyVolume: Array<{
        date: string;
        volume: number;
        count: number;
    }>;
}

export interface AdminUser {
    id: string;
    phoneNumber: string;
    name: string;
    email: string | null;
    status: string;
    createdAt: string;
    _count: {
        wallets: number;
        refreshTokens: number;
    };
}

export interface AdminTransaction {
    id: string;
    recipientProvider: string;
    recipientNumber: string;
    amount: string;
    fee: string;
    status: string;
    createdAt: string;
    senderWallet: {
        user: {
            name: string;
            phoneNumber: string;
        };
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    pages: number;
}

export const adminApi = {
    login: async(
    username:string,
    password:string
    )=>{
        const response =
            await adminClient.post(
                "/admin/login",
                { username, password }
            );
        return response.data.data;
    },

    getStats: async (): Promise<AdminStats> => {
        const response = await adminClient.get("/admin/stats");
        return response.data.data;
    },

    getUsers: async (
        page = 1,
        limit = 20
    ): Promise<{ users: AdminUser[]; total: number; pages: number}> => {
        const response = await adminClient.get("/admin/users", {
            params: { page, limit },
        });
        return response.data.data;
    },

    getTransactions: async (
        page = 1,
        limit = 20
    ): Promise<{
        transactions: AdminTransaction[];
        total: number;
        pages: number;
    }> => {
        const response = await adminClient.get("/admin/transactions", {
            params: { page, limit },
        });
        return response.data.data;
    },
};