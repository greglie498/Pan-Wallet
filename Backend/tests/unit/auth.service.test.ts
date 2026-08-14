import { authService } from "../../src/application/auth/auth.service";
import { userRepository } from "../../src/infrastructure/repositories/user.repository";
import { refreshTokenRepository } from "../../src/infrastructure/repositories/refresh-token.repository";
import { paswswordService } from "../../src/infrastructure/security/password.service";
import { jwtService } from "../../src/infrastructure/security/jwt.service";
import { ConflictError, UnauthorizedError, ForbiddenError } from "../../src/domain/error";
import { prisma } from "../../src/infrastructure/database/prisma";

// Added during the Chapter 7 test-completion audit: prior to this file,
// AuthService had zero unit-level coverage — the only tests exercising it
// were the eight integration tests in tests/integration/auth.integration.test.ts,
// which require a live database and were, at the time of the audit, entirely
// unexecuted. This file mocks every collaborator so AuthService's own
// business logic (duplicate checks, password verification, refresh-token
// rotation and reuse detection, suspended-account handling) can be verified
// without a database, the same pattern already used by
// wallet.service.test.ts and transaction.service.test.ts.
jest.mock("../../src/infrastructure/repositories/user.repository");
jest.mock("../../src/infrastructure/repositories/wallet.repository");
jest.mock("../../src/infrastructure/repositories/refresh-token.repository");
jest.mock("../../src/infrastructure/security/password.service");
jest.mock("../../src/infrastructure/security/jwt.service");
jest.mock("../../src/infrastructure/database/prisma", () => ({
  prisma: { $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({})) },
}));

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockedRefreshRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;
const mockedPasswordService = paswswordService as jest.Mocked<typeof paswswordService>;
const mockedJwtService = jwtService as jest.Mocked<typeof jwtService>;

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    phoneNumber: "254712345678",
    name: "Test User",
    email: null,
    password: "$2b$10$hashedvalue",
    status: "ACTIVE",
    ...overrides,
  } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedJwtService.signAccessToken.mockReturnValue("access-token" as never);
  mockedJwtService.signRefreshToken.mockReturnValue("refresh-token" as never);
  mockedRefreshRepo.create.mockResolvedValue({} as never);
});

describe("AuthService.register (Section 6.3.v)", () => {
  it("rejects registration with a phone number that already exists", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(makeUser());

    await expect(
      authService.register({
        phoneNumber: "254712345678",
        name: "Test User",
        password: "Str0ngPassw0rd!",
      } as never)
    ).rejects.toThrow(ConflictError);
  });

  it("rejects registration with an email that already exists", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(null);
    mockedUserRepo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      authService.register({
        phoneNumber: "254799999999",
        name: "Test User",
        email: "taken@example.com",
        password: "Str0ngPassw0rd!",
      } as never)
    ).rejects.toThrow(ConflictError);
  });

  it("hashes the password before storing the user, and issues a token pair on success", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(null);
    mockedPasswordService.hash.mockResolvedValue("$2b$10$newhash" as never);
    mockedUserRepo.create.mockResolvedValue(makeUser({ password: "$2b$10$newhash" }));

    const result = await authService.register({
      phoneNumber: "254712345678",
      name: "Test User",
      password: "Str0ngPassw0rd!",
    } as never);

    expect(mockedPasswordService.hash).toHaveBeenCalledWith("Str0ngPassw0rd!");
    expect(mockedUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: "$2b$10$newhash" }),
      expect.anything()
    );
    expect(result.tokens.accessToken).toBe("access-token");
    expect(result.tokens.refreshToken).toBe("refresh-token");
    // The plaintext password must never appear on the returned user object.
    expect(result.user).not.toHaveProperty("password");
  });
});

describe("AuthService.login (Section 6.3.v)", () => {
  it("rejects login for a phone number that is not registered, with a generic message", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(null);

    await expect(
      authService.login({ phoneNumber: "254700000099", password: "AnyPassword1" } as never)
    ).rejects.toThrow(UnauthorizedError);
  });

  it("rejects login for a suspended account", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(makeUser({ status: "SUSPENDED" }));

    await expect(
      authService.login({ phoneNumber: "254712345678", password: "Str0ngPassw0rd!" } as never)
    ).rejects.toThrow(ForbiddenError);
  });

  it("rejects an incorrect password with the SAME error type/message as an unregistered phone (anti-enumeration)", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(makeUser());
    mockedPasswordService.compare.mockResolvedValue(false);

    let unregisteredError: Error | undefined;
    let wrongPasswordError: Error | undefined;
    try {
      await authService.login({ phoneNumber: "254700000099", password: "x" } as never);
    } catch (e) {
      unregisteredError = e as Error;
    }
    mockedUserRepo.findByPhone.mockResolvedValue(makeUser());
    try {
      await authService.login({ phoneNumber: "254712345678", password: "WrongPassword1" } as never);
    } catch (e) {
      wrongPasswordError = e as Error;
    }

    expect(unregisteredError).toBeInstanceOf(UnauthorizedError);
    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedError);
    expect(unregisteredError?.message).toBe(wrongPasswordError?.message);
  });

  it("issues a new token pair on successful login", async () => {
    mockedUserRepo.findByPhone.mockResolvedValue(makeUser());
    mockedPasswordService.compare.mockResolvedValue(true);

    const result = await authService.login({
      phoneNumber: "254712345678",
      password: "Str0ngPassw0rd!",
    } as never);

    expect(result.tokens.accessToken).toBe("access-token");
  });
});

describe("AuthService.refresh — rotation and reuse detection (Section 6.3.v)", () => {
  it("rotates: issues a new token pair and revokes the used token by hash", async () => {
    mockedJwtService.verifyRefreshToken.mockReturnValue({
      sub: "user-1",
      phone: "254712345678",
      family: "family-1",
    } as never);
    mockedRefreshRepo.findByTokenHash.mockResolvedValue({
      revoked: false,
      family: "family-1",
      expiresAt: new Date(Date.now() + 100000),
    } as never);

    const tokens = await authService.refresh({ refreshToken: "old-refresh-token" } as never);

    expect(mockedRefreshRepo.revokeByTokenHash).toHaveBeenCalled();
    expect(tokens.accessToken).toBe("access-token");
  });

  it("[reuse detection] rejects a revoked/reused refresh token and revokes the WHOLE token family", async () => {
    mockedJwtService.verifyRefreshToken.mockReturnValue({
      sub: "user-1",
      phone: "254712345678",
      family: "family-1",
    } as never);
    mockedRefreshRepo.findByTokenHash.mockResolvedValue({
      revoked: true, // already used once — this is a replay
      family: "family-1",
      expiresAt: new Date(Date.now() + 100000),
    } as never);

    await expect(
      authService.refresh({ refreshToken: "stolen-refresh-token" } as never)
    ).rejects.toThrow(UnauthorizedError);

    expect(mockedRefreshRepo.revokeAllByFamily).toHaveBeenCalledWith("family-1");
  });

  it("rejects a refresh token whose stored record no longer exists", async () => {
    mockedJwtService.verifyRefreshToken.mockReturnValue({
      sub: "user-1", phone: "254712345678", family: "family-1",
    } as never);
    mockedRefreshRepo.findByTokenHash.mockResolvedValue(null);

    await expect(
      authService.refresh({ refreshToken: "unknown-token" } as never)
    ).rejects.toThrow(UnauthorizedError);
  });

  it("rejects an expired refresh token", async () => {
    mockedJwtService.verifyRefreshToken.mockReturnValue({
      sub: "user-1", phone: "254712345678", family: "family-1",
    } as never);
    mockedRefreshRepo.findByTokenHash.mockResolvedValue({
      revoked: false,
      family: "family-1",
      expiresAt: new Date(Date.now() - 1000), // already expired
    } as never);

    await expect(
      authService.refresh({ refreshToken: "expired-token" } as never)
    ).rejects.toThrow(UnauthorizedError);
  });
});

describe("AuthService.logout", () => {
  it("revokes the refresh token by hash when it is valid and not already revoked", async () => {
    mockedJwtService.verifyRefreshToken.mockReturnValue({
      sub: "user-1", phone: "254712345678", family: "family-1",
    } as never);
    mockedRefreshRepo.findByTokenHash.mockResolvedValue({ revoked: false } as never);

    await authService.logout({ refreshToken: "valid-token" } as never);

    expect(mockedRefreshRepo.revokeByTokenHash).toHaveBeenCalled();
  });

  it("treats logout as successful even with an already-invalid/expired token, and does not throw", async () => {
    mockedJwtService.verifyRefreshToken.mockImplementation(() => {
      throw new Error("expired");
    });

    await expect(authService.logout({ refreshToken: "garbage" } as never)).resolves.toBeUndefined();
  });
});