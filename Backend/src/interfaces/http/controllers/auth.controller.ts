import { Request, Response } from "express";
import { authService } from "../../../application/auth/auth.service";
import { asyncHandler } from "../../../shared/async-handler";
import { sendSuccess } from "../../../shared/http-response";

class AuthController {
    register = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.register(req.body);
        return sendSuccess(res, 201, result, "Account created successfully.");
    });

    login = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.login(req.body);
        return sendSuccess(res, 200, result, "Login successfull");
    });

    firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.firebaseLogin(req.body);
        return sendSuccess(res, 200, result, "Authentication successfull");
    })

    refresh = asyncHandler(async (req: Request, res: Response) => {
        const tokens = await authService.refresh(req.body);
        return sendSuccess(res, 200, tokens, "Token refreshed successfully");
    });

    logout = asyncHandler(async (req: Request, res: Response) => {
        await authService.logout({
            refreshToken: req.body.refreshToken,
            userId: req.user?.id,
        });
    })
}

export const authController = new AuthController();