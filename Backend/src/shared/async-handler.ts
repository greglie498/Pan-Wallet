import { Request, Response, nextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRequestHandler): requestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}