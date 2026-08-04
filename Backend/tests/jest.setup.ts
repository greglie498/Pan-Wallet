import dotenv from "dotenv";
import path from "path";

// Loaded before every test file. Ensures config/env.ts (which validates
// process.env at import time and calls process.exit(1) on failure) always
// sees a complete, valid set of variables — pointed at the test database,
// never the real one.
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Keep test output readable — Winston still logs to the console by default,
// which is noisy inside `jest --verbose`. Comment this out if you want to
// see application logs while debugging a failing test.
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";

jest.setTimeout(15000);

// src/config/firebase.ts eagerly initialises firebase-admin at import time,
// which pulls in firebase-admin/auth -> jwks-rsa -> jose. `jose` ships as
// pure ESM (`export { ... }` with no CommonJS build for this version), and
// Jest's default config does not transform node_modules — so ANY test that
// transitively imports auth.service.ts (which imports config/firebase.ts
// unconditionally, even though Firebase login is optional and not the
// primary auth path — Section 6.2.ii) fails with:
//   SyntaxError: Unexpected token 'export'
//
// Rather than teaching Jest to transform an ESM dependency it will never
// actually need for these tests (none of them exercise the Firebase-token
// login path), config/firebase.ts is mocked globally here. Real Firebase
// credentials are never required to run this suite.
jest.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn().mockRejectedValue(
      new Error("firebaseAuth is mocked in tests — see tests/jest.setup.ts")
    ),
  },
}));
