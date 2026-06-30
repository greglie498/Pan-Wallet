import rateLimit from "express-rate-limit";
import { env } from "../../../config/env";
import { sendError } from "../../../shared/http-response";

export const generalRateLimit = rateLimit ({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        sendError(
            res,
            429,
            "Too many requests. Please try again later",
            "RATE_LIMIT_EXCEEDED"
        );
    },
});

export const authRateLimit = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        sendError(
            res,
            429,
            "Too many authentication attempts. Please try again later.",
            "AUTH_RATE_LIMIT_EXCEEDED"
        );
    },
});