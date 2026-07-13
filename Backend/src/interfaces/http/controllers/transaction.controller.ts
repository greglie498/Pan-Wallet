import { Request, Response } from "express";
import { transactionService } from "../../../application/transactions/transaction.service";
import { mpesaProvider } from "../../../infrastructure/providers/mpesa.provider";
import { mtnMomoProvider } from "../../../infrastructure/providers/mtn-momo.provider";
import { UnauthorizedError } from "../../../domain/error";
import { asyncHandler } from "../../../shared/async-handler";
import { sendSuccess } from "../../../shared/http-response";
import { logger } from "../../../config/logger";

class TransactionController {
    getQuote = asyncHandler (async (req: Request, res: Response) => {
        if (!req.user) throw new UnauthorizedError();

        const { senderWalletId, recipientProvider, amount } = req.body;

        const quote = await transactionService.getQuote(
            senderWalletId,
            recipientProvider,
            Number(amount),
            req.user.id
        );

        return sendSuccess(res, 200, quote, "Quote retrieved successfully.");
    });

    initiateTransfer = asyncHandler (async (req: Request, res: Response) => {
        if (!req.user) throw new UnauthorizedError();

        const result = await transactionService.inititateTransfer(
            req.user.id,
            req.body
        );

        return sendSuccess(res, 201, result, result.message);
    });

    getTransaction = asyncHandler (async (req: Request, res: Response) => {
        if (!req.user) throw new UnauthorizedError();

        const transaction = await transactionService.getTransaction(
            `${req.params["transactionId"]} ?? ""`,
            req.user.id
        );

        return sendSuccess (
            res,
            200,
            transaction,
            "Transaction retrieved successfully"
        );
    });

    listTransactions = asyncHandler ( async (req: Request, res: Response) => {
        if (!req.user) throw new UnauthorizedError();

        const walletId = req.query["walletId"] as string | undefined;

        const transactions = await transactionService.listTransactions(
            req.user.id,
            walletId
        );

        return sendSuccess(
            res,
            200,
            transactions,
            "Transactions retrieved successfully."
        );
    });

    //------ Provider callbacks --------------------------------------------------------------------------------------------------------------

    mpesaCallback = asyncHandler (async (req: Request, res: Response) => {
        try {
            const parsed = mpesaProvider.parseCallback(req.body);

            await transactionService.handleCallback({
                providerReferenceId: parsed.checkoutRequestId,
                success: parsed.success,
                failureReason: parsed.success ? undefined : parsed.resultDesc,
            });
        } catch (error) {
            //Always return 200 to M-Pesa - if we return an error code
            // Daraja will keep retrying callback indefinitely
            logger.error("Error processing M-Pesa callback:", error);
        }

        return sendSuccess(res, 200, null, "Callback received.");
    });

    mtnCallback = asyncHandler (async (req: Request, res: Response) => {
        try {
            const { referenceId, status } = req.body as {
                referenceId: string;
                status: string;
            };

            await transactionService.handleCallback({
                providerReferenceId: referenceId,
                success: status === "SUCCESSFULL",
                failureReason: status !== "SUCCESSFULL" ? status : undefined,
            });
        } catch (error) {
            logger.error("Error processing MTN callback:", error);
        }

        // Always return 200 or MTN as well
        return sendSuccess(res, 200, null, "Callback received.");
    });
}

export const transactionController = new TransactionController();