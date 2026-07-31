import { Transaction, WalletProvider } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { transactionRepository } from "../../infrastructure/repositories/transaction.repository";
import { exchangeRateRepository } from "../../infrastructure/repositories/exchange-rate.repository";
import { exchangeRateProvider } from "../../infrastructure/providers/exchange-rate.provider";
import { mpesaProvider } from "../../infrastructure/providers/mpesa.provider";
import { mtnMomoProvider } from "../../infrastructure/providers/mtn-momo.provider";
import {
    NotFoundError,
    BadRequestError,
    UnprocessableError,
} from "../../domain/error";
import { logger } from "../../config/logger";
import {
    InitiateTransferInput,
    TransferQuote,
    TransferResult,
    CallbackResult,
} from "./transaction.type";

// Fixed fee per provider in source currency
const PROVIDER_FEES: Record<string, number> = {
    MPESA: 25,
    MTN_MOMO: 1,
    PANWALLET_INTERNAL: 0,
};


class TransactionService {

    // ── Private helpers ────────────────────────────────────────────

    private getCurrencyForProvider(provider: string): string {
        const map: Record<string, string> = {
            MPESA: "KES",
            MTN_MOMO: "XOF",
            PANWALLET_INTERNAL: "USD",
        };
        return map[provider] ?? "USD";
    }

    private async buildQuote(
        senderWalletId: string,
        recipientProvider: string,
        amount: number,
        recipientNumber:string
    ): Promise<TransferQuote> {
        const senderWallet = await walletRepository.findById(senderWalletId);
        if (!senderWallet) throw new NotFoundError("Sender wallet");

        const senderCurrency = senderWallet.currency;
        const recipientCurrency = this.getCurrencyForProvider(recipientProvider);

        const { rate, convertedAmount } = await exchangeRateProvider.convert(
            amount,
            senderCurrency,
            recipientCurrency
        );

        const fee = PROVIDER_FEES[recipientProvider] ?? 0;
        const totalDeducted = amount + fee;

        return {
            senderWalletId,
            senderCurrency,
            recipientProvider,
            recipientNumber: "",
            amount,
            convertedAmount,
            exchangeRate: rate,
            fee,
            totalDeducted,
            recipientCurrency,
        };
    }

    private async callProvider(
        recipientProvider: string,
        recipientNumber: string,
        amount: number,
        externalId: string,
        description: string,
    ): Promise<string> {
        const callbackPath = recipientProvider === "MPESA"
            ? "/api/v1/transactions/mpesa/callback"
            : "/api/v1/transactions/mtn/callback";
        const callbackUrl = new URL(callbackPath, env.BASE_URL);
        callbackUrl.searchParams.set("token", env.PROVIDER_CALLBACK_TOKEN);

        logger.info("Calling provider:", {
            recipientProvider,
            amount,
            recipientNumber,
            callbackUrl: callbackUrl.toString(),
        });

        switch (recipientProvider) {
            case "MPESA": {
                const response = await mpesaProvider.initiateStkPush(
                    recipientNumber,
                    amount,
                    externalId,
                    description,
                    callbackUrl.toString()
                );
                return response.CheckoutRequestID;
            }

            case "MTN_MOMO": {
                const referenceId = await mtnMomoProvider.requestToPay(
                    recipientNumber,
                    amount,
                    externalId,
                    description,
                    description,
                    callbackUrl.toString()
                );
                return referenceId;
            }

            default:
                throw new BadRequestError(
                    `Unsupported provider: ${recipientProvider}`
                );
        }
    }

    // ── Public methods ─────────────────────────────────────────────

    async getQuote(
        senderWalletId: string,
        recipientProvider: string,
        amount: number,
        userId: string
    ): Promise<TransferQuote> {
        const senderWallet = await walletRepository.findById(senderWalletId);

        if (!senderWallet || senderWallet.userId !== userId) {
            throw new NotFoundError("Sender wallet");
        }

        if (senderWallet.status !== "ACTIVE") {
            throw new UnprocessableError("Sender wallet is not active.");
        }

        if (amount <= 0) {
            throw new BadRequestError("Transfer amount must be greater than zero.");
        }

        return this.buildQuote(senderWalletId, recipientProvider, amount);
    }

    async initiateTransfer(
        userId: string,
        input: InitiateTransferInput
    ): Promise<TransferResult> {
        // Step 1 — validate sender wallet
        const senderWallet = await walletRepository.findById(input.senderWalletId);

        if (!senderWallet || senderWallet.userId !== userId) {
            throw new NotFoundError("Sender wallet");
        }

        if (senderWallet.status !== "ACTIVE") {
            throw new UnprocessableError("Sender wallet is not active.");
        }

        if (input.amount <= 0) {
            throw new BadRequestError("Transfer amount must be greater than zero.");
        }

        // Step 1b — balance check
        const fee = PROVIDER_FEES[input.recipientProvider] ?? 0;
        const requiredAmount = new Prisma.Decimal(input.amount).plus(fee);
        if (senderWallet.balance.lessThan(requiredAmount)) {
            throw new BadRequestError(
                `Insufficient balance. Available: ${senderWallet.currency} ${senderWallet.balance.toFixed(2)}. Required: ${senderWallet.currency} ${requiredAmount.toFixed(2)}.`
            );
        }

        const senderCurrency = senderWallet.currency;
        const recipientCurrency = this.getCurrencyForProvider(input.recipientProvider);

        // Step 2 — fetch live exchange rate
        const { rate, convertedAmount } = await exchangeRateProvider.convert(
            input.amount,
            senderCurrency,
            recipientCurrency
        );

        logger.info("Exchange rate fetched for transfer:", {
            inputAmount: input.amount,
            senderCurrency,
            recipientCurrency,
            rate,
            convertedAmount,
        });

        const description =
            input.description ??
            `PanWallet transfer to ${input.recipientNumber}`;

        // Step 3 — create exchange rate record + PENDING transaction atomically
        const { transaction } = await prisma.$transaction(async (tx) => {
            const debited = await walletRepository.deductIfSufficient(
                input.senderWalletId,
                requiredAmount,
                tx
            );
            if (!debited) {
                throw new BadRequestError("Insufficient balance for this transfer and its fee.")
            }
            const savedRate = await exchangeRateRepository.create(
                {
                    sourceCurrency: senderCurrency,
                    targetCurrency: recipientCurrency,
                    rate: rate,
                },
                tx
            );

            const newTransaction = await transactionRepository.create(
                {
                    senderWallet: { connect: { id: input.senderWalletId } },
                    recipientProvider: input.recipientProvider as WalletProvider,
                    recipientNumber: input.recipientNumber,
                    amount: input.amount,
                    fee,
                    exchangeRate: { connect: { id: savedRate.id } },
                    status: "PENDING",
                },
                tx
            );

            return { transaction: newTransaction };
        });

        // Step 4 — call provider outside DB transaction
        let providerReferenceId: string;

        try {
            providerReferenceId = await this.callProvider(
                input.recipientProvider,
                input.recipientNumber,
                convertedAmount,
                transaction.id,
                description,
            );
        } catch (error) {
            // In development — auto-complete transaction despite provider callback error
            if (env.NODE_ENV === "development") {
                logger.warn("Provider call failed in sandbox — auto-completing transaction.", {
                    transactionId: transaction.id,
                    error: error instanceof Error ? error.message : String(error),
                });

                await transactionRepository.updateProviderReference(
                    transaction.id,
                    `SANDBOX-${transaction.id}`
                );

                await transactionRepository.updateStatus(
                    transaction.id,
                    "COMPLETED",
                    undefined
                );

                logger.info("Sandbox: transaction auto-completed.", {
                    transactionId: transaction.id,
                });

                return {
                    transactionId: transaction.id,
                    status: "COMPLETED",
                    providerReferenceId: `SANDBOX-${transaction.id}`,
                    quote: {
                        senderWalletId: input.senderWalletId,
                        senderCurrency,
                        recipientProvider: input.recipientProvider,
                        recipientNumber: input.recipientNumber,
                        amount: input.amount,
                        convertedAmount,
                        exchangeRate: rate,
                        fee,
                        totalDeducted: input.amount + fee,
                        recipientCurrency,
                    },
                    message: "Sandbox transfer completed successfully.",
                };
            }

            // Production — mark as failed and re-throw
            await prisma.$transaction(async (tx) => {
                await transactionRepository.updateStatus(
                    transaction.id,
                    "FAILED",
                    error instanceof Error ? error.message : "Provider call failed.",
                    tx
                );
                await walletRepository.topUp(transaction.senderWalletId, requiredAmount, tx);
            });
            throw error;
        }

        // Step 5 — store provider reference ID (only reached in production)
        await transactionRepository.updateProviderReference(
            transaction.id,
            providerReferenceId
        );

        logger.info("Transfer initiated successfully.", {
            transactionId: transaction.id,
            providerReferenceId,
            provider: input.recipientProvider,
            amount: input.amount,
            convertedAmount,
        });

        return {
            transactionId: transaction.id,
            status: "PENDING",
            providerReferenceId,
            quote: {
                senderWalletId: input.senderWalletId,
                senderCurrency,
                recipientProvider: input.recipientProvider,
                recipientNumber: input.recipientNumber,
                amount: input.amount,
                convertedAmount,
                exchangeRate: rate,
                fee,
                totalDeducted: input.amount + fee,
                recipientCurrency,
            },
            message:
                input.recipientProvider === "MPESA"
                    ? "STK push sent. Ask the recipient to check their phone."
                    : "Payment request sent to recipient's MTN MoMo account.",
        };
    }

    async handleCallback(result: CallbackResult): Promise<void> {
        const transaction = await transactionRepository.findByProviderReference(
            result.providerReferenceId
        );

        if (!transaction) {
            logger.warn("Callback received for unknown transaction.", {
                providerReferenceId: result.providerReferenceId,
            });
            return;
        }

        if (transaction.status !== "PENDING") {
            logger.warn("Callback received for non-pending transaction.", {
                transactionId: transaction.id,
                currentStatus: transaction.status,
            });
            return;
        }

       const status = result.success ? "COMPLETED" : "FAILED";
        const updated = await prisma.$transaction(async (tx) => {
            const changed = await transactionRepository.updateStatusIfPending(
                transaction.id,
                status,
                result.failureReason,
                tx
            );
            if (!changed || result.success) return changed;

            const refund = new Prisma.Decimal(transaction.amount).plus(transaction.fee);
            await walletRepository.topUp(transaction.senderWalletId, refund, tx);
            return changed;
        });

        if (!updated) return;

        logger.info("Transaction status updated via callback.", {
            transactionId: transaction.id,
            status: result.success ? "COMPLETED" : "FAILED",
        });
    }
    async getTransaction(
        transactionId: string,
        userId: string
    ): Promise<Transaction> {
        const transaction = await transactionRepository.findById(transactionId);

        if (!transaction) throw new NotFoundError("Transaction");

        const senderWallet = await walletRepository.findById(
            transaction.senderWalletId
        );

        if (!senderWallet || senderWallet.userId !== userId) {
            throw new NotFoundError("Transaction");
        }

        return transaction;
    }
    async listTransactions(
        userId: string,
        walletId?: string
    ): Promise<Transaction[]> {
        if (walletId) {
            const wallet = await walletRepository.findById(walletId);
            if (!wallet || wallet.userId !== userId) {
                throw new NotFoundError("Wallet");
            }
            return transactionRepository.findBySenderWalletId(walletId);
        }

        return transactionRepository.findByUserId(userId);
    }
}

export const transactionService = new TransactionService();