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

export type LinkWalletInput = z.infer<typeof linkWalletSchema>
