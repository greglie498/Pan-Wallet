import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../domain/error";
import { sendError } from "../../../shared/http-response";
import { logger } from "../../../config/logger";
import { env } from "../../../config/env";

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Known application error - safe to expose to client
    if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.code);
        return;
    }

    // Unknown error - log it, hide details from client
    logger.error({
        message: "Unhandled error",
        error: err instanceof Error ? err.message : String (err),
        stack: err instanceof Error ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });

    const message =
    env.NODE_ENV === "development" && err instanceof Error
    ? err.message
    : "An unexpected error occured.";

    sendError(res, 500, message, "INTERNAL_ERROR");
}