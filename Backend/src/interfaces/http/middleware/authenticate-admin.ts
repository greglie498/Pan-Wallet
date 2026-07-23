import { Request, Response, NextFunction } from "express";
import { jwtService } from "../../../infrastructure/security/jwt.service";
import { UnauthorizedError, ForbiddenError } from "../../../domain/error";

declare global {
    namespace Express {
        interface Request {
            admin?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}

export function authenticateAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("No token provided."));
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwtService.verifyAccessToken(token);

        if (payload.role !== "ADMIN") {
            return next(new ForbiddenError("Admin access required."));
        }

        req.admin = {
            id: payload.sub,
            email: payload.phone,
            role: payload.role,
        };

        next();
    } catch (error) {
        next(error);
    }
}