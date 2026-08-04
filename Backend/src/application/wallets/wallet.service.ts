import { Wallet, WalletProvider } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../domain/error";
import { LinkWalletInput } from "../../interfaces/http/validators/wallet.validators";

class WalletService {
  async listWallets(userId: string): Promise<Wallet[]> {
    return walletRepository.findByUserId(userId);
  }

  async getWallet(walletId: string, userId: string): Promise<Wallet> {
    const wallet = await walletRepository.findById(walletId);

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundError("Wallet");
    }

    return wallet;
  }

  async linkWallet(userId: string, input: LinkWalletInput): Promise<Wallet> {
    const provider = input.provider as WalletProvider;
    // Check 1 — Is this wallet number already linked to any account?
    const existingGlobal =
      await walletRepository.findByProviderAndWalletNumber(
        provider,
        input.walletNumber
      );
    if (existingGlobal) {
      throw new ConflictError(
        `This ${input.provider} number is already linked to an account.`
      );
    }
    // Check 2 — Does this user already have this provider linked?
    const existingUserProvider = await walletRepository.findByUserAndProvider(
      userId,
      provider
    );
    if (existingUserProvider) {
      throw new ConflictError(
        `You already have an ${input.provider} wallet linked to your account.`
      );
    }
    // All checks passed — create linked wallet
    try {
      return await walletRepository.create({
        provider,
        walletNumber: input.walletNumber,
        currency: this.getCurrencyForProvider(provider),
        user: { connect: { id: userId } },
      });
    } catch (error) {
      // Handle race condition fallback if DB unique constraint triggers
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(
          "Wallet or provider combination is already registered."
        );
      }
      throw error;
    }
  }

  async topUp(
    walletId: string,
    userId: string,
    amount: number
  ): Promise<Wallet> {
    // Validate ownership
    const wallet = await walletRepository.findById(walletId);
    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundError("Wallet");
    }
    if (wallet.status !== "ACTIVE") {
      throw new BadRequestError("Cannot top up a suspended or closed wallet.");
    }
    if (amount <= 0) {
      throw new BadRequestError("Top-up amount must be greater than zero.");
    }
    if (amount > 10000) {
      throw new BadRequestError(
        "Maximum top-up amount is $10,000 per transaction."
      );
    }
    const decimalAmount = new Prisma.Decimal(amount);
    return walletRepository.topUp(walletId, decimalAmount);
  }
  async unlinkWallet(walletId: string, userId: string): Promise<void> {
    const wallet = await walletRepository.findById(walletId);

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundError("Wallet");
    }

    if (wallet.provider === WalletProvider.PANWALLET_INTERNAL) {
      throw new BadRequestError(
        "Your internal PanWallet cannot be unlinked."
      );
    }
    try {
      await walletRepository.delete(walletId);
    } catch (error) {
      // Handle foreign key constraint failure if wallet has transaction history
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new BadRequestError(
          "Cannot unlink wallet with associated transaction history."
        );
      }
      throw error;
    }
  }

  private getCurrencyForProvider(provider: WalletProvider): string {
    const currencyMap: Record<string, string> = {
      MPESA: "KES",
      MTN_MOMO: "XOF",
      PANWALLET_INTERNAL: "USD",
    };

    return currencyMap[provider] ?? "USD";
  }
}

export const walletService = new WalletService();