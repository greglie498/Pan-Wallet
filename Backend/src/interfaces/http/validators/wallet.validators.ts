import { z } from "zod";

export const linkWalletSchema = z.object({
    provider: z.enum(["MPESA", "MTN_MOMO"]), 

    walletNumber: z
        .string()
        .min(10, "Wallet number must be at least 10 characters")
        .max(15, "Wallet number must not exceed 15 characters. ")
        .regex(
            /^\+?[1-9]|d{9,14}$/,
            "Invalid wallet number format."
        )
        .trim(),
});

export const topUpSchema = z.object({
    amount: z.coerce
        .number()
        .positive("Amount must be greater than zero.")
        .max(10000, "Maximum top-up is $10,000."),
});

export type LinkWalletInput = z.infer<typeof linkWalletSchema>
