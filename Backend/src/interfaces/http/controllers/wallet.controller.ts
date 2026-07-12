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

        const wallets = await walletService.listWallets(req.user.id);
        return sendSuccess(res, 200, wallets, "Wallets retrieved successfully");
    });

    getWallet = asyncHandler(async (req: Request, res: Response) => {
        if(!req.user) throw new UnauthorizedError();

        const wallet = await walletService.getWallet(
            req.params.walletId as string,
            req.user.id
        );
        return sendSuccess(res, 200, wallet, "Wallet retrieved successfully. ");
    });

    linkWallet = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new UnauthorizedError();

        const wallet = await walletService.linkWallet(req.user.id, req.body);
        return sendSuccess(res, 201, wallet, "Wallet linked successfully. ");
    });

    unlinkWallet = asyncHandler(async (req: Request, res: Response ) => {
        if (!req.user) throw new UnauthorizedError();

        await walletService.unlinkWallet(req.params.walletId as string , req.user.id);
        return sendSuccess(res, 200, null, "Wallet unliked successfully. ");
    });
}

export const walletController = new WalletController();