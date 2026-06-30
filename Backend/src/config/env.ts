import { z } from "zod";

export const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4000),

    // Database
    DATABASE_URL: z.string().url(),

    //JWT
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // Security
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    CORS_ORIGINS: z
        .string()
        .transform((value) => value.split(",").map((s) => s.trim())),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(90000), // 15 minutes
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100), // limit each IP to 100 requests per windowMs
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10), // limit each IP to 10 requests per windowMs for auth routes


    //Wallet defaults
    DEFAULT_WALLET_PROVIDER: z.string().default("PANWALLET_INTERNAL"),
    DEFAULT_WALLET_CURRENCY: z.string().default("KES"),

    // Admin seed (optional)
    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_USERNAME: z.string().min(3).optional(),
    SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {

    console.error("❌ Invalid environment variables:\n");
    parsed.error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
}

export const env = parsed.data;