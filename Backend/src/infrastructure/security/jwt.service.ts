import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../domain/error";

export interface TokenPayload {
    sub: string;
    phone: string;
    role?: string;
}

export interface RefreshTokenPayload extends TokenPayload {
    family: string;
}

function isTokenPayload(value: any): value is TokenPayload {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as Record<string, unknown>)["sub"] === "string" &&
        typeof (value as Record<string, unknown>)["phone"] === "string"
    );
}

function isRefreshTokenPayload(value: any): value is RefreshTokenPayload {
    return (
        isTokenPayload(value) &&
        typeof (value as unknown as Record<string, unknown>)["family"] === "string"
    );
}

class JwtService {
    signAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, {
            expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
        });
    }

    signRefreshToken(payload: RefreshTokenPayload): string {
        return jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
        });
    }

    verifyAccessToken(token: string): TokenPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET as Secret);
            if (!isTokenPayload(decoded)) {
                throw new UnauthorizedError("Invalid access token payload.");
            }
            return decoded;
        } catch (error) {
            throw new UnauthorizedError("Invalid or expired access token.");
        }
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as Secret);
            if (!isRefreshTokenPayload(decoded)) {
                throw new UnauthorizedError("Invalid refresh token payload.");
            }
            return decoded;
        } catch (error) {
            throw new UnauthorizedError("Invalid or expired refresh token.");
        }
    }
}

export const jwtService = new JwtService();
