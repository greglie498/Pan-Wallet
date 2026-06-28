import winston from "winston";
import { env } from "./env";

const isDevelopment = env.NODE_ENV === "development";

const logger = winston.createLogger({
    level: isDevelopment ? "debug" : "info",
    format: isDevelopment
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
    ],
});