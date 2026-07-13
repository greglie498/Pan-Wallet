import { Prisma, Transaction } from "@prisma/client";
import { prisma } from "../database/prisma";


class TransactionRepository {
    async create(
        data: Prisma.TransactionCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<Transaction> {
        const client = tx ?? prisma;
        return client.transaction.create({ data });
    }

    async findById(id: string): Promise<Transaction | null> {
        return prisma.transaction.findUnique ({
            where: { id },
            include: { exchangeRate: true },
        });
    }

    async findBySenderWalletId(senderWalletId: string): Promise<Transaction[]> {
        return prisma.transaction.findMany({
            where: { senderWalletId },
            include: { exchangeRate: true },
            orderBy: { createdAt: "desc"},
        });
    }

    async findByUserId(userId: string): Promise<Transaction[]> {
        return prisma.transaction.findMany({
            where: {
                senderWallet: {
                    userId,
                },
            },
            include: { exchangeRate: true },
            orderBy: { createdAt: "desc" },
        });
    }

    async findByProviderReference(
        providerReferenceId: string
    ): Promise<Transaction | null> {
        return prisma.transaction.findFirst({
            where: { providerReferenceId },
        });
    }

    async updateStatus(
        id: string,
        status: string,
        failureReason?: string
    ): Promise <Transaction> {
        return prisma.transaction.update({
             where: { id },
            data: {
                status: status as Prisma.EnumTransactionStatusFieldUpdateOperationsInput["set"],
                ...(failureReason && { failureReason }),
            },
        });
    }

    async updateProviderReference (
        id: string,
        providerReferenceId: string
    ): Promise<Transaction> {
        return prisma.transaction.update({
            where: { id },
            data: { providerReferenceId },
        });
    }
}

export const transactionRepository = new TransactionRepository();