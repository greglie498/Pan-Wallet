import { prisma } from "../../src/infrastructure/database/prisma";

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.exchangeRate.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma as testPrisma };
