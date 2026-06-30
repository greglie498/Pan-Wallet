import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../../../shared/http-response";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if(!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field:issue.path.join("."),
                message: issue.message,
            }));

            sendError(
                res,
                422,
                "Validation failed.",
                "VALIDATION_ERROR",
                errors
            );
            return;
        }

        req.body = result.data; //replace body with the parse+coerced data
        next();
    };
}