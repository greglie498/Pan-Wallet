import { createApp } from "../../src/app";

/**
 * createApp() (Section 6.3.xi) builds the Express app without binding a
 * port, which is exactly what supertest needs — it drives requests
 * directly against the in-memory app instance, so no real network port
 * or running server process is required to run these tests.
 */
export function buildTestApp() {
  return createApp();
}
