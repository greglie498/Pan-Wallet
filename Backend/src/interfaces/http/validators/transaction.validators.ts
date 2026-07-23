import { z } from "zod";

export const getQuoteSchema = z.object({
    senderWalletId: z.string().uuid("Invalid sender wallet ID. "),
    recipientProvider: z.enum(["MPESA", "MTN_MOMO"] as const, {
        error: () => ({
            message: "Provider must be MPESA or MTN_MOMO.",
        }),
    }),
    amount: z.coerce    
        .number()
        .positive("Amount must be greater than zero.")
        .max(1000000, "Amount exceeds maximum transfer limit."),
});

export const initiateTransferSchema = z.object({
    senderWalletId: z.string().uuid("Invalid sender wallet ID."),
    recipientProvider: z.enum(["MPESA", "MTN_MOMO"] as const, {
        error: () => ({
            message: "Provider must be MPESA or MTN_MOMO",
        }),
    }),
    recipientNumber: z
        .string()
        .min(10, "recipient number must be at least 10 characters.")
        .max(15, "Recipient number must not exceed 15 characters.")
        .regex(/^\+?[1-9]\d{9,14}$/, "Invalid recipient phone number format")
        .trim(),
    amount: z.coerce
        .number()
        .positive("Amount must be greater than zero.")
        .max(1000000, "Amount exceeds maximum transfer limit."),
    description: z.string().max(100).optional(),
    callbackUrl: z.string().url().optional(),
});

export const listTransactionsSchema = z.object({
    walletId: z.string().uuid().optional(),
});