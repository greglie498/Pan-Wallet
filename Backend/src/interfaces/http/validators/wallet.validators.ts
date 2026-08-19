import { z } from "zod";

export const linkWalletSchema = z.object({
    provider: z.enum(["MPESA", "MTN_MOMO"]), 

    walletNumber: z
        .string()
        .min(10, "Wallet number must be at least 10 characters")
        .max(15, "Wallet number must not exceed 15 characters. ")
        .regex(
            /^\+?\d{9,14}$/,
            "Invalid wallet number format."
        )
        .trim(),
});

export const topUpSchema = z.object({
    amount: z.coerce
        .number()
        .positive("Amount must be greater than zero.")
        .max(10000, "Maximum top-up is $10,000."),
    currency: z.string().length(3, "Currency must be a 3-letter code.").toUpperCase(),
});

export type LinkWalletInput = z.infer<typeof linkWalletSchema>
