import { Transaction, WalletProvider } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma";
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
    InternalServerError,
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
    MPESA: 25,      // KES 25 per transaction
    MTN_MOMO: 1,    // 1 EUR equivalent in sandbox
    PANWALLET_INTERNAL: 0,
};

class TransactionService {

    //----- Private helpers ---------------------------------------------------------------------------------------------------

    private getCurrencyForProvider (provider: string): string {
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
        amount: number
    ): Promise<TransferQuote> {
        const senderWallet = await walletRepository.findById(senderWalletId);
        if (!senderWallet) throw new NotFoundError ("Sender wallet");

        const senderCurrency = senderWallet.currency;
        const recipientCurrency = this.getCurrencyForProvider (recipientProvider);

        // Fetch exchange rate
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

    private async callProvider (
        recipientProvider: string,
        recipientNumber: string,
        amount: number,
        externalId: string,
        description: string,
        callbackUrl?: string
    ): Promise<string> {
        switch (recipientProvider) {
            case "MPESA": {
                const response = await mpesaProvider.initiateStkPush (
                    recipientNumber,
                    amount,
                    externalId,
                    description,
                    callbackUrl ?? `${process.env["BASE_URL"]}/api/v1/transactions/mpesa/callback`
                );
                return response.CheckoutRequestID;
            }

            case "MTN_MOMO": {
                const referenceId = await mtnMomoProvider.requestToPay(
                    recipientNumber,
                    amount,
                    externalId,
                    description,
                    callbackUrl ?? ""
                );
                return referenceId;
            }

            default:
                throw new BadRequestError(
                    `Unsupported provider: ${recipientProvider}`
                );
        }
    }


    //------ Public methods -----------------------------------------------------------------------------------------------------------------------------------

    async getQuote (
        senderWalletId: string,
        recipientProvider: string,
        amount: number,
        userId: string
    ): Promise<TransferQuote> {
        const senderWallet = await walletRepository.findById(senderWalletId);

        if(!senderWallet || senderWallet.userId !== userId) {
            throw new NotFoundError("Sender Wallet");
        }

        if (senderWallet.status !== "ACTIVE") {
            throw new UnprocessableError("Sender Wallet is not active");
        }

        if(amount <= 0) {
            throw new BadRequestError ("Transfer amount must be greater than zero.");
        }

        const quote = await this.buildQuote(
            senderWalletId,
            recipientProvider,
            amount
        );

        return quote;
    }

    async inititateTransfer(
        userId: string,
        input: InitiateTransferInput
    ): Promise<TransferResult> {
        // Step 1 - validate sender wallet
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

        const senderCurrency = senderWallet.currency;
        const recipientCurrency = this.getCurrencyForProvider(
            input.recipientProvider
        );

        // Step 2 - fetch and store exchange rate
        const { rate, convertedAmount } = await exchangeRateProvider.convert(
            input.amount,
            senderCurrency,
            recipientCurrency
        );

        const fee = PROVIDER_FEES[input.recipientProvider] ?? 0;
        const description = input.description ?? `PanWallet transfer to ${input.recipientNumber}`;

        // Step 3 - create exchange rate record + PENDING transaction atomically
        const { transaction, exchangeRate } = await prisma .$transaction( async (tx) => {
            // Save the exchange rate at time of transaction
            const savedRate = await exchangeRateRepository.create(
                {
                    sourceCurrency: senderCurrency,
                    targetCurrency: recipientCurrency,
                    rate: rate,
                },
                tx
            );

            // Create the transaction as PENDING
            const newTransaction = await transactionRepository.create(
                {
                    senderWallet: { connect: { id: input.senderWalletId } },
                    recipientProvider: input.recipientProvider as WalletProvider,
                    recipientNumber: input.recipientNumber,
                    amount: input.amount,
                    fee,
                    exchangeRate: { connect: { id: savedRate.id } },
                    status: "PENDING"
                },
                tx
            );

            return { transaction: newTransaction, exchangeRate: savedRate };
        });


        // Step 4 - call the provider outside the DB transaction
        // (provider calls are slow and should not hold a DB transaction open)
        let providerReferenceId: string;

        try {
            providerReferenceId = await this.callProvider(
                input.recipientProvider,
                input.recipientNumber,
                convertedAmount,
                transaction.id,
                description,
                input.callbackUrl
            );
        } catch (error) {
            // Provider call failed - mark transaction as FAILED immediately
            await transactionRepository.updateStatus(
                transaction.id,
                "FAILED",
                error instanceof Error ? error.message : "Provider call failed."
            );
            throw error;
        }

        // Step 5 - update transaction with provider reference ID
        await transactionRepository.updateProviderReference (
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
                    : "Payment request sent to recipient's MTN MoMo account."
        };
    }
    
    async handleCallback (result: CallbackResult): Promise<void> {
        const transaction = await transactionRepository.findByProviderReference(
            result.providerReferenceId
        );

        if(!transaction) {
            logger.warn("Callback received for unknow transaction.", {
                providerReferenceId: result.providerReferenceId,
            });
            return;
        }

        if(transaction.status !== "PENDING") {
            logger.warn("Callback received for non-pending transaction. ", {
                trasactionId: transaction.id,
                currentStatus: transaction.status,
            });
            return;
        }

        await transactionRepository.updateStatus(
            transaction.id,
            result.success ? "COMPLETED" : "FAILED",
            result.failureReason
        );

        logger.info("Transaction status updated via callback. ", {
            transactionId: transaction.id,
            status: result.success ? "COMPLETED" : "FAILED"
        });
    }

    async getTransaction(
        transactionId: string,
        userId: string
    ): Promise<Transaction> {
        const transaction = await transactionRepository.findById(transactionId);

        if (!transaction) throw new NotFoundError("Transaction");

        // Verify the transaction belongs to this user via the sender wallet
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
            // Verify wallet belongs to user
            const wallet = await walletRepository.findById(walletId);
            if (!wallet || wallet.userId !== userId) {
                throw new NotFoundError("wallet");
            }
            return transactionRepository.findBySenderWalletId(walletId);
        }

        return transactionRepository.findByUserId(userId);
    }
}

export const transactionService = new TransactionService();