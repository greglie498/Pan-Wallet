import { createApp } from "./app";
import { prisma } from "./infrastructure/database/prisma";
import { logger } from "./config/logger";
import { env } from "./config/env";

async function startServer() {
  try {
    await prisma.$connect();

    logger.info("✅ Database connected");

    const app = createApp();

    const server = app.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        `🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`
      );
    });


    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. shutting down...`);

      server.close(async () => {
        try {
          await prisma.$disconnect();
          logger.info("Database disconnected");
          process.exit(0);
        } catch (error) {
          logger.error("Shutdown error", error);
          process.exit(1);
        }
      });
    };


    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));


    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", error);
    });


    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection", reason);
    });


  } catch(error) {
    logger.error("Failed to start server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}


startServer();