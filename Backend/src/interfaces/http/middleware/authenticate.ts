import { Request, Response, NextFunction } from "express";
import { jwtService } from "../../../infrastructure/security/jwt.service";
import { UnauthorizedError } from "../../../domain/error";

// Extend Express Request type globally to include `user`
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                phone: string;
            }
        }
    }
}

export function authenticate (
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthorizedError("No token provided."));
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const payload = jwtService.verifyAccessToken(token);
        req.user = {id: payload.sub, phone: payload.phone };
        next();
    } catch (error) {
        next(error);
    }
}