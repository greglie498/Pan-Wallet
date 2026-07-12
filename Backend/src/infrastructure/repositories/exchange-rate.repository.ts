import { ExchangeRate, Prisma } from "@prisma/client";
import { prisma } from "../database/prisma";

class ExchangeRateRepository {
    async create (
        data: Prisma.ExchangeRateCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<ExchangeRate> {
        const client = tx ?? prisma;
        return client.exchangeRate.create({ data });
    }

    async findById(id: string): Promise<ExchangeRate | null> {
        return prisma.exchangeRate.findUnique({ where: { id } });
    }

    async findLatest (
        sourceCurrency: string,
        targetCurrency: string
    ): Promise<ExchangeRate | null> {
        return prisma.exchangeRate.findFirst({
            where: { sourceCurrency, targetCurrency },
            orderBy: { recordedAt: "desc" },
        });
    }

    async deletedOlderThan(date: Date): Promise<void> {
        await prisma.exchangeRate.deleteMany({
            where: { recordedAt: { lt: date } },
        });
    }
}

export const exchangeRateRepository = new ExchangeRateRepository();