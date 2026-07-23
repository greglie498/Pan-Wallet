import { adminRepository } from "../../infrastructure/repositories/admin.repository";

class AdminStatsService {
    async getStats() {
        const[
            totalUsers,
            totalTransactions,
            totalVolume,
            transactionsByStatus,
            transactionsByProvider,
            dailyVolume,
        ] = await Promise.all ([
            adminRepository.getTotalUsers(),
            adminRepository.getTotalTransactions(),
            adminRepository.getTotalVolume(),
            adminRepository.getTransactionByStatus(),
            adminRepository.getTransactionsByProvider(),
            adminRepository.getDailyVolume(7),
        ]);

        const completed = transactionsByStatus["COMPLETED"] ?? 0;
        const successRate = 
            totalTransactions > 0
                ? Math.round((completed / totalTransactions) * 100)
                : 0;

        return {
            totalUsers,
            totalTransactions,
            totalVolume,
            successRate,
            transactionsByStatus,
            transactionsByProvider,
            dailyVolume,
        };
    }

    async getUsers(page = 1, limit = 20) {
        return adminRepository.getAllUsers(page, limit);
    }

    async getTransactions(page = 1, limit = 20) {
        return adminRepository.getAllTransactions(page, limit);
    }
}

export const adminStatsService = new AdminStatsService();