import { Request, Response } from "express";
import { errorHandler } from "../../src/interfaces/http/middleware/error-handler";
import { ConflictError, NotFoundError } from "../../src/domain/error";

jest.mock("../../src/config/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

function mockReq(overrides: Partial<Request> = {}) {
  return { path: "/api/v1/wallets/link", method: "POST", ...overrides } as Request;
}

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("errorHandler middleware (Backend/src/interfaces/http/middleware/error-handler.ts)", () => {
  it("exposes a known AppError's own status code, message and code to the client", () => {
    const res = mockRes();
    const next = jest.fn();

    errorHandler(
      new ConflictError("This MPESA number is already linked to an account."),
      mockReq(),
      res,
      next
    );

    expect(res.status).toHaveBeenCalledWith(409);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload).toMatchObject({
      success: false,
      code: "CONFLICT",
      message: "This MPESA number is already linked to an account.",
    });
  });

  it("maps NotFoundError to a 404 with the NOT_FOUND code", () => {
    const res = mockRes();
    errorHandler(new NotFoundError("Wallet"), mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.code).toBe("NOT_FOUND");
  });

  it("hides an unknown (non-AppError) error's real message from the client and returns 500 INTERNAL_ERROR", () => {
    // env.NODE_ENV is "test" (Backend/.env.test), which takes the same
    // production-like branch as NODE_ENV=production in error-handler.ts —
    // only NODE_ENV=development would leak err.message to the client.
    const res = mockRes();
    const sensitiveError = new Error("relation \"users\" does not exist — leaking a raw DB error");

    errorHandler(sensitiveError, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.code).toBe("INTERNAL_ERROR");
    expect(payload.message).not.toContain("relation");
    expect(payload.message).not.toContain("users");
  });

  it("never calls next() — this middleware always terminates the request", () => {
    const res = mockRes();
    const next = jest.fn();

    errorHandler(new NotFoundError(), mockReq(), res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
