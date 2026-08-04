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
  jest.config.js
  .env.test.example
  tests/
    jest.setup.ts              # loads .env.test before every test file
    helpers/
      db.ts                    # resetDatabase() — wipes test DB between tests
      app.ts                   # buildTestApp() — the real Express app, no port bound
    unit/
      password.service.test.ts       ✅ runs here, 4 tests pass
      jwt.service.test.ts            ✅ runs here, 7 tests pass
      validate.middleware.test.ts    ✅ runs here, 6 tests pass
      error-handler.test.ts          ✅ runs here, 4 tests pass
      wallet.service.test.ts         ⚠️  needs `prisma generate` — see below
      transaction.service.test.ts    ⚠️  needs `prisma generate` — see below
    integration/
      auth.integration.test.ts       ⚠️  needs a real test database — see below
```

## Why some of these say "needs prisma generate"

I wrote and reviewed all seven files to the same standard, but I built this
inside a sandboxed environment with no access to `binaries.prisma.sh`, so I
could only actually **execute** the four files that don't import
`@prisma/client` at all (password/JWT services and the two middleware files
are pure logic with no ORM dependency). The other three import Prisma types
(`Wallet`, `Prisma.Decimal`, etc.) and Prisma needs its generated client
present to resolve those — which requires running `prisma generate` against
a network you already have working, since you run the app locally every day.

**Before your first `npm test`, run:**
```
npx prisma generate
```
This is the same command your app already implicitly relies on — nothing new,
just something my sandbox couldn't reach. Once that's done, all seven files
should run. If any of `wallet.service.test.ts` or `transaction.service.test.ts`
fail on first run, it's most likely a small mismatch between the mock setup
and the exact current shape of `WalletRepository`/`TransactionRepository` —
check the error message against the actual method signatures in
`src/infrastructure/repositories/`, since those may have shifted slightly
since these tests were written.

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
