import { Wallet, WalletProvider } from "@prisma/client";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { NotFoundError, ConflictError, BadRequestError } from "../../domain/error";
import { LinkWalletInput } from "../../interfaces/http/validators/wallet.validators";

class WalletService {
    async listWallets(userId: string): Promise<Wallet[]> {
        return walletRepository.findByUserId(userId);
    }

    async getwallet (walletId: string, userId: string): Promise<Wallet> {
        const wallet = await walletRepository.findById(walletId);

        if(!wallet || wallet.userId !== userId) {
            throw new NotFoundError("wallet");
        }

        return wallet;
    }

    async linkwallet(userId: string, input: LinkWalletInput): Promise<Wallet> {
        const provider = input.provider as WalletProvider;

        // Check 1 - is this wallet number already linked to any account?
        const existingGlobal = await walletRepository.findByProviderAndWalletNumber(
            provider,
            input.walletNumber
        );
        
        if (existingGlobal) {
            throw new ConflictError(
                `This ${input.provider} number is already linked to an account.`
            );
        }

        // Check 2 - does this user already have this provider linked?
        const existingUserProvider = await walletRepository.findByUserAndProvider(
            userId,
            provider
        );

        if (existingUserProvider) {
            throw new ConflictError(
                 `You already have an ${input.provider} wallet linked to your account.`
            );
        }

        // All checks passed - created the linked wallet
        return walletRepository.create({
            provider,
            walletNumber: input.walletNumber,
            currency: this.getCurrencyForProvider(provider),
            user: { connect: {id: userId } },
        });

    }

    async unlinkWallet(walletId: string, userId: string): Promise<void> {
            const wallet = await walletRepository.findById(walletId);

            if (!wallet || wallet.userId !==userId) {
                throw new NotFoundError("wallet")
            }

            if (wallet.provider === WalletProvider.PANWALLET_INTERNAL) {
                throw new BadRequestError(
                    "Your internal PanWallet cannot be unlinked."
                );
            }

            await walletRepository.delete(walletId);
        }

        private getCurrencyForProvider(provider: WalletProvider): string {
            const currencyMap: Record<string, string> ={
                MPESA: "KES",
                ORANGE_MONEY: "XOF",
                PANWALLET_INTERNAL: "USD",
            };

            return currencyMap[provider] ?? "KES";
        }
}

export const walletservice = new WalletService();