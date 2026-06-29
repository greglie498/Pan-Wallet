import { Wallet } from "@prisma/client";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { NotFoundError } from "../../domain/error";

class WalletService {
    async listWallets (userId: string): Promise<Wallet[]> {
        const wallets = await walletRepository.findByUserId(userId);
        return wallets;
    }

    async getWallet(walletId: string, userId: string): Promise<Wallet>{
        const wallet = await walletRepository.findByUserId(walletId);

        if (!wallet || wallet.userId !== userId) {
            throw new NotFoundError("wallet");
        }

        return wallet;
    }
}

export const walletService = new WalletService();