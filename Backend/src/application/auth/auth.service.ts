import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { userRepository } from "../../infrastructure/repositories/user.repository";
import { walletRepository } from "../../infrastructure/repositories/wallet.repository";
import { refreshTokenRepository } from "../../infrastructure/repositories/refresh-token.repository";
import { paswswordService } from "../../infrastructure/security/password.service";
import { jwtService } from "../../infrastructure/security/jwt.service";
import { ConflictError, UnauthorizedError, ForbiddenError } from "../../domain/error";
import { env } from "../../config/env";
import { WalletProvider } from "../../domain/enum";
import {
    RegisterInput,
    LoginInput,
    RefreshInput,
    LogoutInput,
    AuthTokens,
    AuthResult,
} from "./auth.type";
import { prisma } from "../../infrastructure/database/prisma";

class AuthService {
    //----- helpers ------------------------------------------------------------------------

    private hashToken(token: string): string {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
    
    private parseExpiryToDate(expiry: string): Date {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days if parsing fails

        const amount = Number(match[1]);
        const unit = match[2] as "s" | "m" | "h" | "d";

        const multipliers: Record<"s" | "m" | "h" | "d", number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return new Date(Date.now() + amount * multipliers[unit]);
    }

    private async issueTokens(
        userId: string,
        phoneNumber: string,
        family: string
    ): Promise<AuthTokens> {
        const payload = { sub: userId, phone: phoneNumber };

        const accessToken = jwtService.signAccessToken( payload );
        const refreshToken = jwtService.signRefreshToken({ ...payload, family });
        const tokenHash = this.hashToken(refreshToken);

        await refreshTokenRepository.create({
            tokenHash,
            family,
            expiresAt: this.parseExpiryToDate(env.JWT_REFRESH_EXPIRES_IN),
            user: { connect: { id: userId } },
        });

        return { accessToken, refreshToken }
    }

    //----- public methods ----------------------------------------------------------------------------------------

    async register(input: RegisterInput): Promise<AuthResult> {
        const existingPhone = await userRepository.findByPhone(input.phoneNumber);
        if (existingPhone) {
            throw new ConflictError("An account with this phone number already exists.");
        }

        if (input.email) {
            const existingEmail = await userRepository.findByEmail(input.email);
            if(existingEmail) {
                throw new ConflictError("An account with this email already exists.");
            }
        }

        const hashedPassword = await paswswordService.hash(input.password);

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await userRepository.create(
                {
                phoneNumber: input.phoneNumber,
                name: input.name,
                email: input.email,
                password: hashedPassword,
                },
                tx
            );

            await walletRepository.create(
                {
                    provider: WalletProvider.PANWALLET_INTERNAL,
                    walletNumber: input.phoneNumber,
                    currency: env.DEFAULT_WALLET_CURRENCY.toUpperCase(),
                    user: { connect: { id: newUser.id } },
                },
                tx
            );

            return newUser
        });

        const family = crypto.randomUUID();
        const tokens = await this.issueTokens(user.id, user.phoneNumber, family);

        return {
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                email: user.email,
            },
            tokens,
        };
    }
    
    async login(input: LoginInput): Promise<AuthResult> {
        const user = await userRepository.findByPhone(input.phoneNumber);
        if (!user || !user.password) {
            throw new UnauthorizedError("Invalid phone number or password");
        }

        if (user.status === "SUSPENDED") {
            throw new ForbiddenError("This account has been suspended");
        }

        const passwordMatch = await paswswordService.compare(input.password, user.password)
        if (!passwordMatch) {
            throw new UnauthorizedError("Invalid phone number or password");
        }

        const family = crypto.randomUUID();
        const tokens = await this.issueTokens(user.id, user.phoneNumber, family);

        return {
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                email: user.email,
            },
            tokens,
        };
    }

    async refresh(input: RefreshInput): Promise<AuthTokens> {
        const payload = jwtService.verifyRefreshToken(input.refreshToken);
        const tokenHash = this.hashToken(input.refreshToken);
        const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

        if (!stored || stored.revoked) {
            // token reuse detected - revoke entire family
            await refreshTokenRepository.revokeAllByFamily(payload.family);
            throw new UnauthorizedError("Refresh token has been revoked. Please log in again.");
        }

        await refreshTokenRepository.revokeAllByFamily(tokenHash);

        const tokens = await this.issueTokens(
            payload.sub,
            payload.phone,
            payload.family
        );

        return tokens;
    }

    async logout(input: LogoutInput): Promise<void> {
        try{
            const payload = jwtService.verifyRefreshToken(input.refreshToken);
            const tokenHash = this.hashToken(input.refreshToken);
            const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

            if (stored && !stored.revoked){
                await refreshTokenRepository.revokeByTokenHash(tokenHash);
            }
        } catch {
            // if the token is invalid or expired we still treat logout as successfull
            // - the user is already effectively logged out
        }
    }
}

export const authService = new AuthService();