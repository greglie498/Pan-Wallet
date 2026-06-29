import { Prisma, RefreshToken } from "@prisma/client";
import { prisma } from "../database/prisma";

class RefreshTokenRepository {
    async create(
        data: Prisma.RefreshTokenCreateInput,
        tx?: Prisma.TransactionClient
    ): Promise<RefreshToken> {
        const client = tx ?? prisma;
        return client.refreshToken.create({ data });
    }

    async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
        return prisma.refreshToken.findUnique({ where: { tokenHash } });
    }

    async revokeByTokenHash(
        tokenHash: string,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        const client = tx ?? prisma;
        await client.refreshToken.update({
            where: { tokenHash },
            data: { revoked: true },
        });
    }

    async revokeAllByFamily(
        family: string,
        tx?: Prisma.TransactionClient
    ): Promise<void> {
        const client = tx ?? prisma;
        await client.refreshToken.updateMany({
            where: { family, revoked: false },
            data: { revoked: true },
        });
    }
    
    async deleteExpired(): Promise<void>{
        await prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        })
    }
}

export const refreshTokenRepository = new RefreshTokenRepository();