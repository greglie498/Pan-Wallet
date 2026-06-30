import { Wallet } from "@prisma/client";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { NotFoundError } from "../../domain/error";

class WalletService {
    async listWallets (userId: string): Promise<Wallet[]> {
        const wallets = await walletRepository.findByUserId(userId);
        return wallets;
    }

    async getWallet(walletId: string, userId: string): Promise<Wallet> {
        const wallet = await walletRepository.findById(walletId);

        if (!wallet || wallet.userId !== userId) {
            throw new NotFoundError("Wallet");
        }

        return wallet;
    }
}

export const walletService = new WalletService();