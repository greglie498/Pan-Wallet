import { walletService } from "../../src/application/wallets/wallet.service";
import { walletRepository } from "../../src/infrastructure/repositories/wallet.repository";
import { ConflictError, NotFoundError, BadRequestError } from "../../src/domain/error";
import { Prisma, WalletProvider } from "@prisma/client";

// The service depends only on the repository, so the repository is mocked
// wholesale — these are unit tests of WalletService's business rules, not
// of Prisma or the database.
jest.mock("../../src/infrastructure/repositories/wallet.repository");

const mockedRepo = walletRepository as jest.Mocked<typeof walletRepository>;

function makeWallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "wallet-1",
    userId: "user-1",
    provider: WalletProvider.MPESA,
    walletNumber: "254712345678",
    currency: "KES",
    balance: new Prisma.Decimal(100),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

describe("WalletService.linkWallet", () => {
  it("rejects linking a wallet number already linked to any account (Section 6.3.vi)", async () => {
    mockedRepo.findByProviderAndWalletNumber.mockResolvedValue(makeWallet());

    await expect(
      walletService.linkWallet("user-2", {
        provider: "MPESA",
        walletNumber: "254712345678",
      })
    ).rejects.toThrow(ConflictError);

    // The second check must never run once the first has already failed.
    expect(mockedRepo.findByUserAndProvider).not.toHaveBeenCalled();
  });

  it("rejects a user linking a second wallet on a provider they already have (Section 6.3.vi)", async () => {
    mockedRepo.findByProviderAndWalletNumber.mockResolvedValue(null);
    mockedRepo.findByUserAndProvider.mockResolvedValue(makeWallet());

    await expect(
      walletService.linkWallet("user-1", {
        provider: "MPESA",
        walletNumber: "254799999999",
      })
    ).rejects.toThrow(ConflictError);
  });

  it("links successfully and assigns the correct currency for the provider", async () => {
    mockedRepo.findByProviderAndWalletNumber.mockResolvedValue(null);
    mockedRepo.findByUserAndProvider.mockResolvedValue(null);
    mockedRepo.create.mockResolvedValue(makeWallet({ currency: "KES" }));

    const result = await walletService.linkWallet("user-1", {
      provider: "MPESA",
      walletNumber: "254712345678",
    });

    expect(result.currency).toBe("KES");
    expect(mockedRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "MPESA", currency: "KES" })
    );
  });

  it("converts a Prisma P2002 race-condition error into a ConflictError (Section 6.3.vi)", async () => {
    mockedRepo.findByProviderAndWalletNumber.mockResolvedValue(null);
    mockedRepo.findByUserAndProvider.mockResolvedValue(null);
    mockedRepo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await expect(
      walletService.linkWallet("user-1", {
        provider: "MPESA",
        walletNumber: "254712345678",
      })
    ).rejects.toThrow(ConflictError);
  });
});

describe("WalletService.topUp", () => {
  it("rejects a top-up on a wallet that does not belong to the caller", async () => {
    mockedRepo.findById.mockResolvedValue(makeWallet({ userId: "someone-else" }));

    await expect(walletService.topUp("wallet-1", "user-1", 50)).rejects.toThrow(
      NotFoundError
    );
  });

  it("rejects a top-up on a suspended wallet", async () => {
    mockedRepo.findById.mockResolvedValue(makeWallet({ status: "SUSPENDED" }));

    await expect(walletService.topUp("wallet-1", "user-1", 50)).rejects.toThrow(
      BadRequestError
    );
  });

  it("rejects a top-up amount over the $10,000 cap", async () => {
    mockedRepo.findById.mockResolvedValue(makeWallet());

    await expect(walletService.topUp("wallet-1", "user-1", 10001)).rejects.toThrow(
      BadRequestError
    );
  });

  it("rejects a zero or negative top-up amount", async () => {
    mockedRepo.findById.mockResolvedValue(makeWallet());

    await expect(walletService.topUp("wallet-1", "user-1", 0)).rejects.toThrow(
      BadRequestError
    );
  });
});

describe("WalletService.unlinkWallet", () => {
  it("blocks unlinking the internal PanWallet wallet (Section 6.3.vi)", async () => {
    mockedRepo.findById.mockResolvedValue(
      makeWallet({ provider: WalletProvider.PANWALLET_INTERNAL })
    );

    await expect(walletService.unlinkWallet("wallet-1", "user-1")).rejects.toThrow(
      BadRequestError
    );
    expect(mockedRepo.delete).not.toHaveBeenCalled();
  });

  it("converts a Prisma P2003 (transaction history exists) error into a clear BadRequestError", async () => {
    mockedRepo.findById.mockResolvedValue(makeWallet());
    mockedRepo.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "test",
      })
    );

    await expect(walletService.unlinkWallet("wallet-1", "user-1")).rejects.toThrow(
      BadRequestError
    );
  });
});
