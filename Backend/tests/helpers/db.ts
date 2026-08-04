import { prisma } from "../../src/infrastructure/database/prisma";

/**
 * Deletes all rows from every application table, in an order that respects
 * foreign keys (children before parents). Call this in beforeEach/afterEach
 * so each test starts from a clean, known database state rather than
 * depending on data left over from a previous test.
 *
 * IMPORTANT: this is destructive. It only ever runs against DATABASE_URL as
 * loaded from .env.test (see tests/jest.setup.ts) — never point that file
 * at your real development database.
 */
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
