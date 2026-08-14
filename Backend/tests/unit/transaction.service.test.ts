import { transactionService } from "../../src/application/transactions/transaction.service";
import { walletRepository } from "../../src/infrastructure/repositories/wallet.repository";
import { transactionRepository } from "../../src/infrastructure/repositories/transaction.repository";
import { exchangeRateRepository } from "../../src/infrastructure/repositories/exchange-rate.repository";
import { exchangeRateProvider } from "../../src/infrastructure/providers/exchange-rate.provider";
import { prisma } from "../../src/infrastructure/database/prisma";
import { NotFoundError, UnprocessableError, BadRequestError } from "../../src/domain/error";
import { Prisma, WalletProvider } from "@prisma/client";

// Every collaborator TransactionService touches is mocked — this suite
// exercises TransactionService's own business logic (fee calculation,
// balance checks, provider routing) in isolation from Prisma, the database,
// and the real M-Pesa/MTN HTTP calls.
jest.mock("../../src/infrastructure/repositories/wallet.repository");
jest.mock("../../src/infrastructure/repositories/transaction.repository");
jest.mock("../../src/infrastructure/repositories/exchange-rate.repository");
jest.mock("../../src/infrastructure/providers/exchange-rate.provider");
jest.mock("../../src/infrastructure/providers/mpesa.provider");
jest.mock("../../src/infrastructure/providers/mtn-momo.provider");
jest.mock("../../src/infrastructure/database/prisma", () => ({
  prisma: { $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({})) },
}));

const mockedWalletRepo = walletRepository as jest.Mocked<typeof walletRepository>;
const mockedTxRepo = transactionRepository as jest.Mocked<typeof transactionRepository>;
const mockedRateRepo = exchangeRateRepository as jest.Mocked<typeof exchangeRateRepository>;
const mockedRateProvider = exchangeRateProvider as jest.Mocked<typeof exchangeRateProvider>;

function makeWallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "wallet-1",
    userId: "user-1",
    provider: WalletProvider.PANWALLET_INTERNAL,
    walletNumber: "254712345678",
    currency: "USD",
    balance: new Prisma.Decimal(100),
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

describe("TransactionService.getQuote (Section 6.3.vii)", () => {
  beforeEach(() => {
    mockedRateProvider.convert.mockResolvedValue({ rate: 129.5, convertedAmount: 1295 });
  });

  it("rejects a quote request for a wallet that does not belong to the caller", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ userId: "someone-else" }));

    await expect(
      transactionService.getQuote("wallet-1", "MPESA", 10, "user-1", "254700000000")
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects a quote request against a non-ACTIVE wallet", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ status: "SUSPENDED" }));

    await expect(
      transactionService.getQuote("wallet-1", "MPESA", 10, "user-1", "254700000000")
    ).rejects.toThrow(UnprocessableError);
  });

  it("rejects a zero or negative amount", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet());

    await expect(
      transactionService.getQuote("wallet-1", "MPESA", 0, "user-1", "254700000000")
    ).rejects.toThrow(BadRequestError);
  });

  it("adds the correct fixed fee for each provider (PROVIDER_FEES, Section 6.3.vii)", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet());

    const mpesaQuote = await transactionService.getQuote(
      "wallet-1", "MPESA", 10, "user-1", "254700000000"
    );
    expect(mpesaQuote.fee).toBe(5);
    expect(mpesaQuote.totalDeducted).toBe(15);

    const momoQuote = await transactionService.getQuote(
      "wallet-1", "MTN_MOMO", 10, "user-1", "254700000000"
    );
    expect(momoQuote.fee).toBe(1);
    expect(momoQuote.totalDeducted).toBe(11);
  });

  it("uses the live rate and converted amount returned by exchangeRateProvider, not a hard-coded value", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet());
    mockedRateProvider.convert.mockResolvedValue({ rate: 130.75, convertedAmount: 1307.5 });

    const quote = await transactionService.getQuote(
      "wallet-1", "MPESA", 10, "user-1", "254700000000"
    );

    expect(quote.exchangeRate).toBe(130.75);
    expect(quote.convertedAmount).toBe(1307.5);
  });
});

describe("TransactionService.initiateTransfer — pre-flight checks (Section 6.3.vii)", () => {
  it("rejects a transfer when the sender's balance is insufficient for amount + fee", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ balance: new Prisma.Decimal(3) }));

    await expect(
      transactionService.initiateTransfer("user-1", {
        senderWalletId: "wallet-1",
        recipientProvider: "MPESA",
        recipientNumber: "254700000000",
        amount: 10, // + $5 fee = $15 required, only $3 available
      } as never)
    ).rejects.toThrow(BadRequestError);

    // Balance must be rejected before any DB write is attempted.
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a transfer from a wallet that is not ACTIVE", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ status: "SUSPENDED" }));

    await expect(
      transactionService.initiateTransfer("user-1", {
        senderWalletId: "wallet-1",
        recipientProvider: "MPESA",
        recipientNumber: "254700000000",
        amount: 10,
      } as never)
    ).rejects.toThrow(UnprocessableError);
  });
});

describe("TransactionService.handleCallback (Section 6.3.vii)", () => {
  it("silently discards a callback for an unknown providerReferenceId", async () => {
    mockedTxRepo.findByProviderReference.mockResolvedValue(null);

    await expect(
      transactionService.handleCallback({
        providerReferenceId: "unknown-ref",
        success: true,
      } as never)
    ).resolves.toBeUndefined();

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("is a no-op for a callback referencing a transaction that is no longer PENDING", async () => {
    mockedTxRepo.findByProviderReference.mockResolvedValue({
      id: "txn-1",
      status: "COMPLETED",
    } as never);

    await transactionService.handleCallback({
      providerReferenceId: "ref-1",
      success: true,
    } as never);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("TransactionService.initiateTransfer — happy path (Section 6.3.vii)", () => {
  const mockedMpesa = jest.requireMock(
    "../../src/infrastructure/providers/mpesa.provider"
  ).mpesaProvider;

  beforeEach(() => {
    mockedRateProvider.convert.mockResolvedValue({ rate: 129.5, convertedAmount: 1295 });
    mockedWalletRepo.deductIfSufficient.mockResolvedValue(true as never);
    mockedRateRepo.create.mockResolvedValue({ id: "rate-1" } as never);
    mockedTxRepo.create.mockResolvedValue({
      id: "txn-1",
      senderWalletId: "wallet-1",
      status: "PENDING",
    } as never);
    mockedMpesa.initiateStkPush.mockResolvedValue({
      CheckoutRequestID: "ws_CO_1",
    });
  });

  it("deducts the sender's balance atomically before calling the provider", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ balance: new Prisma.Decimal(100) }));

    await transactionService.initiateTransfer("user-1", {
      senderWalletId: "wallet-1",
      recipientProvider: "MPESA",
      recipientNumber: "254700000000",
      amount: 10,
    } as never);

    expect(mockedWalletRepo.deductIfSufficient).toHaveBeenCalledWith(
      "wallet-1",
      expect.objectContaining({}), // Prisma.Decimal(15) — amount + $5 MPESA fee
      expect.anything()
    );
  });

  it("creates a PENDING transaction record before contacting the provider", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ balance: new Prisma.Decimal(100) }));

    await transactionService.initiateTransfer("user-1", {
      senderWalletId: "wallet-1",
      recipientProvider: "MPESA",
      recipientNumber: "254700000000",
      amount: 10,
    } as never);

    expect(mockedTxRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING", recipientNumber: "254700000000" }),
      expect.anything()
    );
  });

  it("stores the provider's reference ID and returns PENDING status on success", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ balance: new Prisma.Decimal(100) }));

    const result = await transactionService.initiateTransfer("user-1", {
      senderWalletId: "wallet-1",
      recipientProvider: "MPESA",
      recipientNumber: "254700000000",
      amount: 10,
    } as never);

    expect(result.status).toBe("PENDING");
    expect(result.providerReferenceId).toBe("ws_CO_1");
    expect(mockedTxRepo.updateProviderReference).toHaveBeenCalledWith("txn-1", "ws_CO_1");
  });

  it("if deductIfSufficient reports insufficient funds inside the transaction, the transfer is rejected", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ balance: new Prisma.Decimal(100) }));
    mockedWalletRepo.deductIfSufficient.mockResolvedValue(false as never);

    await expect(
      transactionService.initiateTransfer("user-1", {
        senderWalletId: "wallet-1",
        recipientProvider: "MPESA",
        recipientNumber: "254700000000",
        amount: 10,
      } as never)
    ).rejects.toThrow(BadRequestError);
  });
});

describe("TransactionService.handleCallback — status transitions (Section 6.3.vii)", () => {
  it("marks a PENDING transaction COMPLETED on a successful callback, without refunding the wallet", async () => {
    mockedTxRepo.findByProviderReference.mockResolvedValue({
      id: "txn-1",
      status: "PENDING",
      senderWalletId: "wallet-1",
      amount: new Prisma.Decimal(10),
      fee: new Prisma.Decimal(5),
    } as never);
    mockedTxRepo.updateStatusIfPending.mockResolvedValue(true as never);

    await transactionService.handleCallback({
      providerReferenceId: "ws_CO_1",
      success: true,
    } as never);

    expect(mockedTxRepo.updateStatusIfPending).toHaveBeenCalledWith(
      "txn-1", "COMPLETED", undefined, expect.anything()
    );
    expect(mockedWalletRepo.topUp).not.toHaveBeenCalled();
  });

  it("marks a PENDING transaction FAILED on a failed callback and refunds amount + fee to the wallet", async () => {
    mockedTxRepo.findByProviderReference.mockResolvedValue({
      id: "txn-1",
      status: "PENDING",
      senderWalletId: "wallet-1",
      amount: new Prisma.Decimal(10),
      fee: new Prisma.Decimal(5),
    } as never);
    mockedTxRepo.updateStatusIfPending.mockResolvedValue(true as never);

    await transactionService.handleCallback({
      providerReferenceId: "ws_CO_1",
      success: false,
      failureReason: "Insufficient funds on recipient network",
    } as never);

    expect(mockedTxRepo.updateStatusIfPending).toHaveBeenCalledWith(
      "txn-1", "FAILED", "Insufficient funds on recipient network", expect.anything()
    );
    expect(mockedWalletRepo.topUp).toHaveBeenCalledWith(
      "wallet-1",
      expect.objectContaining({}),
      expect.anything()
    );
  });
});

describe("TransactionService.getTransaction (ownership enforcement)", () => {
  it("returns the transaction when the caller owns the sender wallet", async () => {
    mockedTxRepo.findById.mockResolvedValue({
      id: "txn-1",
      senderWalletId: "wallet-1",
    } as never);
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ userId: "user-1" }));

    const result = await transactionService.getTransaction("txn-1", "user-1");
    expect(result.id).toBe("txn-1");
  });

  it("rejects retrieval of a transaction belonging to another user's wallet", async () => {
    mockedTxRepo.findById.mockResolvedValue({
      id: "txn-1",
      senderWalletId: "wallet-1",
    } as never);
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ userId: "someone-else" }));

    await expect(
      transactionService.getTransaction("txn-1", "user-1")
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects retrieval of a transaction ID that does not exist", async () => {
    mockedTxRepo.findById.mockResolvedValue(null as never);

    await expect(
      transactionService.getTransaction("nonexistent", "user-1")
    ).rejects.toThrow(NotFoundError);
  });
});

describe("TransactionService.listTransactions", () => {
  it("lists all of a user's transactions when no walletId filter is given", async () => {
    mockedTxRepo.findByUserId.mockResolvedValue([{ id: "txn-1" }, { id: "txn-2" }] as never);

    const result = await transactionService.listTransactions("user-1");
    expect(result).toHaveLength(2);
    expect(mockedTxRepo.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("rejects a walletId filter for a wallet the caller does not own", async () => {
    mockedWalletRepo.findById.mockResolvedValue(makeWallet({ userId: "someone-else" }));

    await expect(
      transactionService.listTransactions("user-1", "wallet-1")
    ).rejects.toThrow(NotFoundError);
  });
});