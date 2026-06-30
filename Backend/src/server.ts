import { createApp } from "./app";
import { prisma } from "./infrastructure/database/prisma";
import { logger } from "./config/logger";
import { env } from "./config/env";

async function startServer(): Promise<void> {
    try{
        await prisma.$connect();
        logger.info("✅ Database connected");

        const app = createApp();

        const server = app.listen(env.PORT, () => {
            logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
        } );

        const shutdown = async (signal: string): Promise <void> => {
            logger.info(`${signal} received. shutting down gracefully...`);

            server.close(async () => {
                await prisma.$disconnect();
                logger.info("Database disconnected. Process exiting.");
                process.exit(0);
            });

            // Force-exit if shutdown takes too long
            setTimeout(() => {
                logger.error("Forced shutdown after timeout.");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => void shutdown("SIGTERM"));
        process.on("SIGINT", () => void shutdown("SIGINT"));
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
}

void startServer();