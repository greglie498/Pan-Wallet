import { envSchema } from "./logger";


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {

    console.error("❌ Invalid environment variables:\n");
    parsed.error.issues.forEach((issue) => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
}

export const env = parsed.data;