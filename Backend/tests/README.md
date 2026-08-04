# PanWallet Backend — Automated Testing

## Setup (one-time)

1. Copy the test environment template and fill in a **separate** test database:
   ```
   cp .env.test.example .env.test
   ```
   Edit `DATABASE_URL` in `.env.test` if `panwallet_test` isn't the name you want.
   Everything else in `.env.test.example` already works as-is (dummy provider
   credentials — every external provider is mocked in tests that would
   otherwise call them).

2. Create the test database and run migrations against it:
   ```
   createdb panwallet_test
   npx dotenv -e .env.test -- npx prisma migrate deploy
   ```
   (Only needed for the integration tests in `tests/integration/` — the unit
   tests in `tests/unit/` never touch a real database.)

3. Run the suite:
   ```
   npm test              # everything, unit + integration
   npm run test:unit     # unit tests only — fast, no DB needed
   npm run test:coverage # everything, with an HTML coverage report in coverage/
   ```

## What's here

```
Backend/
  jest.config.ts
  .env.test.example
  tests/
    jest.setup.ts              # loads .env.test, mocks Firebase — see Troubleshooting
    helpers/
      db.ts                    # resetDatabase() — wipes test DB between tests
      app.ts                   # buildTestApp() — the real Express app, no port bound
    unit/
      password.service.test.ts       ✅ 4 tests
      jwt.service.test.ts            ✅ 7 tests
      validate.middleware.test.ts    ✅ 6 tests
      error-handler.test.ts          ✅ 4 tests
      wallet.service.test.ts         ✅ 10 tests
      transaction.service.test.ts    ✅ 9 tests
    integration/
      auth.integration.test.ts       needs a real test database — see Setup
```

## Troubleshooting — two real failures and their fixes

Both of these were hit running `npm test` for the first time and are now fixed
in `tests/jest.setup.ts`. Documented here so the fix (and the reasoning behind
it) isn't a mystery later.

### 1. "Cannot find name" / every env var "expected string, received undefined"

If `jwt.service.test.ts` (or anything else that imports `config/env.ts`) fails
with a wall of `console.error` lines like `DATABASE_URL: Invalid input:
expected string, received undefined`, then `Backend/.env.test` does not exist
yet. `dotenv.config()` fails silently when the file is missing — it does not
throw — so `process.env` stays empty, `config/env.ts`'s Zod validation fails,
and it calls `process.exit(1)`, which kills the *entire* Jest process (not
just that one file), so everything after that point in the run never
executes.

**Fix:** run the one-time setup step in this file: `cp .env.test.example
.env.test`.

### 2. `SyntaxError: Unexpected token 'export'` in `tests/integration/auth.integration.test.ts`

This one isn't a setup step you're missing — it's a real incompatibility.
`src/config/firebase.ts` initialises `firebase-admin` at import time, which
pulls in `firebase-admin/auth` → `jwks-rsa` → `jose`. The installed version of
`jose` ships as pure ESM with no CommonJS build, and Jest's default config
does not transform anything under `node_modules`. Any test that transitively
imports `auth.service.ts` — which imports `config/firebase.ts`
unconditionally, even though Firebase-token login is the *optional* auth path
and not the password-based one actually being tested (Section 6.2.ii) — hits
this at module-load time, before a single test even runs.

**Fix (already applied in `tests/jest.setup.ts`):** `config/firebase.ts` is
mocked globally for the whole test run, so `firebase-admin` — and therefore
`jose` — is never actually required:

```ts
jest.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn().mockRejectedValue(
      new Error("firebaseAuth is mocked in tests — see tests/jest.setup.ts")
    ),
  },
}));
```

This is safe because none of the current tests exercise Firebase-token login
— if a test for that path is added later, it should supply its own
`mockResolvedValue` for `verifyIdToken` in that specific test file (Jest lets
individual test files override a global mock's implementation), rather than
this fix needing to change.

## Why the two Prisma-dependent unit test files previously said "needs prisma generate"

Earlier versions of this README noted that `wallet.service.test.ts` and
`transaction.service.test.ts` couldn't be verified because the sandbox they
were written in had no access to `binaries.prisma.sh` to generate the Prisma
client. Since you already run `prisma generate` locally for the app itself,
this resolved itself once these tests ran on your machine — they're now
confirmed passing (10 and 9 tests respectively, per your terminal output).

## A real bug these tests found

`validate.middleware.test.ts` documents (and passes against) a genuine bug in
`src/interfaces/http/validators/wallet.validators.ts`: the `walletNumber`
regex is `/^\+?[1-9]|d{9,14}$/` — missing a backslash before the second `d`
(should be `\d{9,14}`), and the unescaped `|` alternates over the *whole*
pattern rather than being scoped inside it. As written, it will accept a
string of literal letter `d`s as a valid wallet number. The test is written
to flag this (`it("[BUG] currently accepts...")`) rather than hide it — worth
an actual one-line fix:

```ts
// current (buggy):
.regex(/^\+?[1-9]|d{9,14}$/, "Invalid wallet number format.")

// fixed:
.regex(/^\+?[1-9]\d{9,14}$/, "Invalid wallet number format.")
```

## What's *not* covered yet

- Frontend (React Native / Expo) has no automated tests. Zustand stores are
  plain JS/TS and are the easiest place to start — they don't need
  `react-native-testing-library` or a rendered component tree, just Jest.
- `transaction.service.test.ts`'s `handleCallback` tests only cover the
  "unknown reference" and "already resolved" short-circuit paths; the actual
  success/failure-refund branches would be better covered as integration
  tests (real DB, real Decimal math) than as a heavily-mocked unit test.
- No CI workflow yet (e.g. GitHub Actions running `npm test` on every PR).

## Turning this into Chapter 7 evidence

Once `npm test` (or `npm run test:coverage`) runs cleanly for you:
1. Screenshot the terminal output — the ✓/✗ list per file is exactly the
   evidence Chapter 7 needs for each System Testing and UAT claim.
2. For coverage, open `coverage/index.html` in a browser and screenshot the
   summary table.
3. Drop those screenshots into the placeholder boxes in the Chapter 7 draft.
