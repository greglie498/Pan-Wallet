import { jwtService } from "../../src/infrastructure/security/jwt.service";

describe("JwtService", () => {
  const basePayload = { sub: "user-123", phone: "254712345678" };

  describe("access tokens", () => {
    it("signs a token that verifyAccessToken can decode back to the same payload", () => {
      const token = jwtService.signAccessToken(basePayload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.sub).toBe(basePayload.sub);
      expect(decoded.phone).toBe(basePayload.phone);
    });

    it("rejects a token signed with a different secret", () => {
      // Simulates a forged token — signed with some other key, not
      // env.JWT_ACCESS_SECRET.
      const jwt = require("jsonwebtoken");
      const forged = jwt.sign(basePayload, "totally-wrong-secret-value-xxxx");

      expect(() => jwtService.verifyAccessToken(forged)).toThrow(
        "Invalid or expired access token."
      );
    });

    it("rejects a malformed token string", () => {
      expect(() => jwtService.verifyAccessToken("not-a-real-token")).toThrow();
    });

    it("rejects a payload missing both phone and email", () => {
      const jwt = require("jsonwebtoken");
      const { env } = require("../../src/config/env");
      // Signed with the real secret, but the payload itself doesn't satisfy
      // isTokenPayload's shape check (no phone, no email) — this exercises
      // the payload-shape guard independently of signature verification.
      const tokenWithBadShape = jwt.sign(
        { sub: "user-123" },
        env.JWT_ACCESS_SECRET
      );

      expect(() => jwtService.verifyAccessToken(tokenWithBadShape)).toThrow(
        "Invalid or expired access token."
      );
    });
  });

  describe("refresh tokens", () => {
    it("signs and verifies a refresh token, preserving the token family", () => {
      const family = "11111111-1111-1111-1111-111111111111";
      const token = jwtService.signRefreshToken({ ...basePayload, family });
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded.family).toBe(family);
    });

    it("rejects a refresh token verified against verifyAccessToken's secret expectations if family is missing", () => {
      const jwt = require("jsonwebtoken");
      const { env } = require("../../src/config/env");
      // Signed with the refresh secret, but without a `family` claim —
      // this is exactly the shape isRefreshTokenPayload is designed to catch.
      const tokenMissingFamily = jwt.sign(
        basePayload,
        env.JWT_REFRESH_SECRET
      );

      expect(() => jwtService.verifyRefreshToken(tokenMissingFamily)).toThrow(
        "Invalid or expired refresh token."
      );
    });

    it("an access token cannot be verified as a refresh token (different secrets)", () => {
      const accessToken = jwtService.signAccessToken(basePayload);

      expect(() => jwtService.verifyRefreshToken(accessToken)).toThrow();
    });
  });
});
