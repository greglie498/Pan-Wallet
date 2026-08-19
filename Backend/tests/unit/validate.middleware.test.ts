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

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ amount: 42 });
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

describe("linkWalletSchema — wallet number format", () => {
  it("accepts a valid Kenyan local-format number", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "0712345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid international-format Kenyan number", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "+254712345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid international number without the plus sign", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "254712345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric wallet numbers", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "ddddddddddd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a wallet number that is too short", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "123456789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a wallet number that is too long", () => {
    const result = linkWalletSchema.safeParse({
      provider: "MPESA",
      walletNumber: "+254712345678901",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported provider value", () => {
    const result = linkWalletSchema.safeParse({
      provider: "AIRTEL_MONEY",
      walletNumber: "254712345678",
    });
    expect(result.success).toBe(false);
  });
});
