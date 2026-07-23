import { Admin, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma";

class AdminRepository {
    async findByUsername(username: string): Promise<Admin | null> {
        return prisma.admin.findUnique({ where: { username }});
    }

    async findByEmail(email: string): Promise<Admin | null> {
        return  prisma.admin.findUnique({ where: { email }});
    }

    async findById(id: string): Promise<Admin | null> {
        return  prisma.admin.findUnique({ where: { id }});
    }

    async create(data: Prisma.AdminCreateInput): Promise<Admin> {
        return prisma.admin.create({ data });
    }

    // Stats queries
    async getTotalUsers(): Promise <number> {
        return prisma.user.count();
    }

    async getTotalTransactions(): Promise <number> {
        return prisma.transaction.count();
    }

    async getTransactionByStatus(): Promise <Record<string, number>> {
        const results = await prisma.transaction.groupBy({
            by: ["status"],
            _count: { status: true }
        });

        return results.reduce((acc, curr) => {
            acc[curr.status] = curr._count.status;
            return acc;
        }, {} as Record<string, number>);
    }

    async getTotalVolume(): Promise<number> {
        const result = await prisma.transaction.aggregate({
            where: { status: "COMPLETED" },
            _sum: { amount: true },
        });
        return Number(result._sum.amount ?? 0);
    }

    async getTransactionsByProvider(): Promise<Record<string, number>> {
        const results = await prisma.transaction.groupBy({
            by: ["recipientProvider"],
            _count: {recipientProvider: true},
        });

        return results.reduce((acc, curr) => {
            acc[curr.recipientProvider] = curr._count.recipientProvider;
            return acc;
        }, {} as Record<string, number>);
    }

    async getDailyVolume(days: number): Promise<Array<{date: string; volume: number; count: number }>> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: startDate },
                status: "COMPLETED",
            },
            select: {
                createdAt: true,
                amount: true
            },
            orderBy: { createdAt: "asc"},
        });

        // Group by date
        const grouped: Record<string, {volume: number; count: number}> = {};

        transactions.forEach((t) => {
            const date = t.createdAt.toISOString().split("T")[0] ?? "";
            if (!grouped[date]) {
                grouped[date] = { volume: 0, count: 0 };
            }
            grouped[date].volume += Number(t.amount);
            grouped[date].count += 1;
        });
         
        //Fill in missing days with zeros
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() -i);
            const dateStr = date.toISOString().split("T")[0] ?? "";
            result.push({
                date: dateStr,
                volume: grouped[dateStr]?.volume ?? 0,
                count: grouped[dateStr]?.count ?? 0,
            });
        }
        return result;
    }

    async getAllUsers(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: {
                            wallets: true,
                            refreshTokens: true,
                        },
                    },
                },
            }),
            prisma.user.count(),
        ]);

        return { users, total, pages: Math.ceil(total /limit) };
    }

    async getAllTransactions(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    exchangeRate: true,
                    senderWallet: {
                        include: { user: { select: {name: true, phoneNumber: true } } },
                    },
                },
            }),
            prisma.transaction.count(),
        ]);

        return { transactions, total, pages: Math.ceil(total / limit)};
    }
}

export const adminRepository = new AdminRepository();