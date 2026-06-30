import { Response } from "express";

interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T | null;
}

interface ErrorResponse {
    success: false;
    message: string;
    code: string,
    errors?: unknown;
}

export function sendSuccess<T>(
    res: Response,
    statusCode: number,
    data: T | null,
    message = "Success."
): Response<SuccessResponse<T>> {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

export function sendError(
    res: Response,
    statusCode: number,
    message: string,
    code: string,
    errors?: unknown
): Response<ErrorResponse> {
    return res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(errors !== undefined && { errors }),
    });

}