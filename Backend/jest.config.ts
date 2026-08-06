import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "js", "json"],

  testMatch: [
    "<rootDir>/tests/**/*.test.ts",
    "**/__tests__/**/*.test.ts"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Execution configuration
  maxWorkers: process.env.CI ? 1 : "50%",
  clearMocks: true,
  verbose: true,

  // Coverage settings
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/**/*.type.ts"
  ],
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"]
};

export default config;