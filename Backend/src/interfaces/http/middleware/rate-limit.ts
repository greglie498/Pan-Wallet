import rateLimit from "express-rate-limit";
import { env } from "../../../config/env";
import { sendError } from "../../../shared/http-response";

// In NODE_ENV=test, `skip` always returns true so express-rate-limit takes
// no action at all — not even incrementing its counter. This matters
// specifically for tests/integration/auth.integration.test.ts: buildTestApp()
// is called once at module scope, so every test in that file shares one
// in-memory rate-limiter instance. Without this skip, ~18 requests to
// /auth/register, /auth/login, and /auth/refresh across that file's test
// cases would exceed the default AUTH_RATE_LIMIT_MAX=10 partway through,
// causing later tests to fail with an unrelated 429 instead of the status
// their assertions actually expect. Production and development behaviour
// (NODE_ENV=production / development) is unaffected.
const skipInTestEnv = () => env.NODE_ENV === "test";

export const generalRateLimit = rateLimit ({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTestEnv,
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
    skip: skipInTestEnv,
    handler: (_req, res) => {
        sendError(
            res,
            429,
            "Too many authentication attempts. Please try again later.",
            "AUTH_RATE_LIMIT_EXCEEDED"
        );
    },
});