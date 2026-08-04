import { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../src/interfaces/http/middleware/validate";
import { linkWalletSchema } from "../../src/interfaces/http/validators/wallet.validators";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("validate() middleware — generic behaviour", () => {
  const schema = z.object({
    amount: z.coerce.number().positive("Amount must be greater than zero."),
  });

  it("calls next() and replaces req.body with the parsed data on success", () => {
    const req = { body: { amount: "42" } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.body).toEqual({ amount: 42 }); // string coerced to number
  });

  it("responds with 422 VALIDATION_ERROR and a per-field breakdown on failure, without calling next()", () => {
    const req = { body: { amount: -5 } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.code).toBe("VALIDATION_ERROR");
    expect(payload.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "amount" }),
      ])
    );
  });
});

describe("linkWalletSchema — wallet number format (Backend/src/interfaces/http/validators/wallet.validators.ts)", () => {
  // These document the schema's ACTUAL current behaviour, including a bug
  // found while writing this suite: the walletNumber regex
  //   /^\+?[1-9]|d{9,14}$/
  // is missing a backslash before the second `d` (should be `\d{9,14}`),
  // and the unescaped `|` alternates over the WHOLE pattern rather than
  // being scoped inside it. The intended rule was almost certainly
  // "starts with an optional + then a non-zero digit, followed by 9–14
  // more digits". What it actually enforces is: "starts with '+' followed
  // by 1-9" OR "ends with the literal letter d repeated 9–14 times" —
  // neither of which is a phone-number check.

  it("[BUG] currently accepts a string of literal letter 'd's as a valid wallet number", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "ddddddddddd", // 11 chars, well within 10-15
    });
    // This SHOULD fail — flagging with .success === true documents the bug
    // rather than hiding it. If this assertion ever flips to false, the
    // regex has been fixed and this test (and the finding in Chapter 7)
    // should be updated accordingly.
    expect(result.success).toBe(true);
  });

  it("rejects a wallet number that is too short regardless of the regex bug", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed Kenyan M-Pesa number (incidentally, via the first alternative)", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "254712345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported provider value", () => {
    const result = linkWalletSchema.safeParse({
      provider: "AIRTEL_MONEY",
      walletNumber: "254712345678",
    });
    expect(result.success).toBe(false);
  });
});
