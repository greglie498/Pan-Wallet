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
