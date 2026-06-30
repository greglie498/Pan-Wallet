import { Request, Response } from "express";
import { walletService } from "../../../application/wallets/wallet.service";
import { UnauthorizedError } from "../../../domain/error";
import { asyncHandler } from "../../../shared/async-handler";
import { sendSuccess } from "../../../shared/http-response";

class WalletController {
    listwallets = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) {
            throw new UnauthorizedError();
        }

        const walletts = await walletService.listWallets(req.user.id);
        return sendSuccess(res, 200, wallets, "Wallets retrieved successfully");
    });
}

export const walletController = new WalletController();