import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";

jest.setTimeout(15000);

jest.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: jest.fn().mockRejectedValue(
      new Error("firebaseAuth is mocked in tests — see tests/jest.setup.ts")
    ),
  },
}));
