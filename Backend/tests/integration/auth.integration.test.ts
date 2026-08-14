import request from "supertest";
import { buildTestApp } from "../helpers/app";
import { resetDatabase, disconnectDatabase, testPrisma } from "../helpers/db";

// True integration tests: no mocks. These drive real HTTP requests through
// the actual Express app (Section 6.3.xi) into a real Postgres test
// database (Backend/.env.test → DATABASE_URL), exercising exactly the
// same code path a real client on the network would.
//
// Requires: `createdb panwallet_test` once, then `npx prisma migrate deploy`
// against Backend/.env.test's DATABASE_URL before the first run.

const app = buildTestApp();

const VALID_USER = {
  phoneNumber: "254712345678",
  name: "Test User",
  password: "Str0ngPassw0rd!",
};

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe("POST /api/v1/auth/register (Section 6.3.v)", () => {
  it("registers a new user, hashes the password, and creates a default internal wallet", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.phoneNumber).toBe(VALID_USER.phoneNumber);

    // Verify directly against the database, not just the API response —
    // this is what makes it an integration test rather than a repeat of
    // the unit tests: it depends on Prisma, the schema, and the atomic
    // user+wallet transaction in AuthService.register (Section 6.3.v)
    // actually working together correctly.
    const dbUser = await testPrisma.user.findUnique({
      where: { phoneNumber: VALID_USER.phoneNumber },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.password).not.toBe(VALID_USER.password); // bcrypt hash, not plaintext
    expect(dbUser?.password).toMatch(/^\$2[aby]\$/);

    const wallets = await testPrisma.wallet.findMany({
      where: { userId: dbUser?.id },
    });
    expect(wallets).toHaveLength(1);

    const wallet = wallets[0];
    expect(wallet).toBeDefined();
    expect(wallet!.provider).toBe("PANWALLET_INTERNAL");
  });

  it("rejects a second registration with the same phone number (409 CONFLICT)", async () => {
    await request(app).post("/api/v1/auth/register").send(VALID_USER);
    const res = await request(app).post("/api/v1/auth/register").send(VALID_USER);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("rejects a weak password with a 422 VALIDATION_ERROR before touching the database", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID_USER, phoneNumber: "254799999999", password: "weak" });

    expect(res.status).toBe(422);
    const dbUser = await testPrisma.user.findUnique({
      where: { phoneNumber: "254799999999" },
    });
    expect(dbUser).toBeNull();
  });
});

describe("POST /api/v1/auth/login (Section 6.3.v)", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(VALID_USER);
  });

  it("logs in with the correct phone number and password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      phoneNumber: VALID_USER.phoneNumber,
      password: VALID_USER.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it("rejects an incorrect password with a generic message that does not reveal the account exists", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      phoneNumber: VALID_USER.phoneNumber,
      password: "WrongPassword1",
    });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).not.toContain("password"); // doesn't say *which* field was wrong
  });

  it("rejects login for a phone number that was never registered, with the SAME message/status as a wrong password", async () => {
    const unregistered = await request(app).post("/api/v1/auth/login").send({
      phoneNumber: "254700000099",
      password: "AnyPassword1",
    });
    const wrongPassword = await request(app).post("/api/v1/auth/login").send({
      phoneNumber: VALID_USER.phoneNumber,
      password: "WrongPassword1",
    });

    // Identical status + message for both cases is what prevents the login
    // endpoint being used to enumerate which phone numbers are registered.
    expect(unregistered.status).toBe(wrongPassword.status);
    expect(unregistered.body.message).toBe(wrongPassword.body.message);
  });
});

describe("POST /api/v1/auth/refresh — rotation and reuse detection (Section 6.3.v)", () => {
  async function registerAndLogin() {
    const registerRes = await request(app).post("/api/v1/auth/register").send(VALID_USER);
    return registerRes.body.data.tokens as { accessToken: string; refreshToken: string };
  }

  it("rotates: the old refresh token cannot be used again after a successful refresh", async () => {
    const tokens = await registerAndLogin();

    const first = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.refreshToken).not.toBe(tokens.refreshToken); // a new token was issued

    // Re-using the ORIGINAL (now-revoked) refresh token must fail.
    const reuse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it("[reuse detection] revokes the WHOLE token family, so even the newest refresh token stops working", async () => {
    const tokens = await registerAndLogin();

    const first = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    const newRefreshToken = first.body.data.refreshToken as string;

    // Simulate a stolen, already-used token being replayed.
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: tokens.refreshToken }); // triggers reuse detection

    // The legitimate, newer token — from the same family — must now ALSO
    // be rejected, proving the whole family was revoked, not just the
    // one reused token.
    const afterReuse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: newRefreshToken });
    expect(afterReuse.status).toBe(401);
  });
});
