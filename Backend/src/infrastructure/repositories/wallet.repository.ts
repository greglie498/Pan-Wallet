import {Prisma, Wallet, WalletProvider } from "@prisma/client";
import {prisma} from "../database/prisma";

class WalletRepository {
    async create(
        data: Prisma.WalletCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<Wallet> {
        const client = tx ?? prisma;
        return client.wallet.create({data});
    }

    async findById(id: string): Promise<Wallet | null> {
        return prisma.wallet.findUnique({where: {id}});
    }

    async findByUserId(userId: string): Promise<Wallet []> {
        return prisma.wallet.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        })
    }

    async findByProviderAndWalletNumber(
        provider: WalletProvider,
        walletNumber: string
    ): Promise<Wallet | null> {
        return prisma.wallet.findUnique({
            where: { 
                provider_walletNumber: { provider, walletNumber }
             },
        });
    }
}

export const walletRepository = new WalletRepository();
