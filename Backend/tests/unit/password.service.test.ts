// Note: the actual exported name in the source file is `paswswordService`
// (transposed letters) — a pre-existing typo in
// src/infrastructure/security/password.service.ts, used consistently
// wherever it's imported. Kept as-is here so the test imports the real
// symbol; worth a one-line cleanup in the source at some point.
import { paswswordService } from "../../src/infrastructure/security/password.service";

describe("PasswordService", () => {
  it("hashes a password to a bcrypt hash, not the plaintext value", async () => {
    const plain = "Str0ngPassw0rd!";
    const hash = await paswswordService.hash(plain);

    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt version prefix
    expect(hash.length).toBe(60); // bcrypt hashes are always 60 chars
  });

  it("produces a different hash for the same password on each call (salting)", async () => {
    const plain = "Str0ngPassw0rd!";
    const [hashA, hashB] = await Promise.all([
      paswswordService.hash(plain),
      paswswordService.hash(plain),
    ]);

    expect(hashA).not.toBe(hashB);
  });

  it("compare() returns true for the correct password against its own hash", async () => {
    const plain = "Str0ngPassw0rd!";
    const hash = await paswswordService.hash(plain);

    await expect(paswswordService.compare(plain, hash)).resolves.toBe(true);
  });

  it("compare() returns false for an incorrect password", async () => {
    const hash = await paswswordService.hash("Str0ngPassw0rd!");

    await expect(paswswordService.compare("WrongPassword1", hash)).resolves.toBe(
      false
    );
  });
});
