import { z } from "zod";

export const registerSchema = z.object({
    phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters.")
    .max(15, "Phone number must not exceed 15 characters.")
    .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number format."),

    name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must not exceed 100 characters.")
    .trim(),

    email: z
    .string()
    .email("Invalid email address.")
    .toLowerCase()
    .optional(),
    
    password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must not exceed 72 charcaters.")
    .regex(
        /^(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase, one lowercase letter, and one number."
    ),
});

export const loginSchema = z.object({
    phoneNumber: z.string().min(1, "Phone number is required."),
    password: z.string().min(1, "Password is required."),
});

export const firebaseAuthSchema = z.object({
    idToken: z.string().min(1, "Firebase ID token is required."),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});