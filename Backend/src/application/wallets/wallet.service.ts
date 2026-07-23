import { Wallet, WalletProvider } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { NotFoundError, ConflictError, BadRequestError } from "../../domain/error";
import { LinkWalletInput } from "../../interfaces/http/validators/wallet.validators";

class WalletService {
    async listWallets(userId: string): Promise<Wallet[]> {
        return walletRepository.findByUserId(userId);
    }

    async getWallet (walletId: string, userId: string): Promise<Wallet> {
        const wallet = await walletRepository.findById(walletId);

        if(!wallet || wallet.userId !== userId) {
            throw new NotFoundError("wallet");
        }

        return wallet;
    }

    async linkWallet(userId: string, input: LinkWalletInput): Promise<Wallet> {
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

    async  topUp(
        walletId: string,
        userId: string,
        amount: number
    ): Promise<Wallet> {
        // Validate ownership
        const wallet = await walletRepository.findById(walletId);
        if (!wallet || wallet.userId !== userId) {
            throw new NotFoundError("wallet");
        }

        if (wallet.status !== "ACTIVE"){
            throw new BadRequestError("CAnnot top up a suspended or closed wallet.");
        }

        if (amount <= 0) {
            throw new BadRequestError("Top-up amount must be greater than zero");
        }

        if (amount > 10000) {
            throw new BadRequestError("Maximum top-up amount is $10,000 per transaction.");
        }

        const decimalAmount = new Prisma.Decimal(amount);
        return walletRepository.topUp(walletId, decimalAmount);
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
                MTN_MOMO: "XOF",  // MTN MoMo operates accross mutiples currencies
                PANWALLET_INTERNAL: "USD",
            };

            return currencyMap[provider] ?? "USD";
        }
}

export const walletService = new WalletService();