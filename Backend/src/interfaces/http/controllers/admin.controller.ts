import { Request, Response } from "express";
import { adminService } from "../../../application/admin/admin.service";
import { adminStatsService } from "../../../application/admin/admin.stast.service";
import { asyncHandler } from "../../../shared/async-handler";
import { sendSuccess } from "../../../shared/http-response";
import { ForbiddenError } from "../../../domain/error";

class AdminController {
    //----- Auth ----------------------------------------------------------------
    login = asyncHandler(async (req: Request, res: Response) => {
        const result =await adminService.login(req.body);
        return sendSuccess(res, 200, result, "Admin login successfull.");
    });

    //--- Stats -------------------------------------------------------------------
    getStats = asyncHandler(async (req: Request, res: Response) => {
        if (!req.admin) throw new ForbiddenError();
        const stats = await adminStatsService.getStats();
        return sendSuccess(res, 200, stats, "Stats retrieved successfully.");
    });

    //---- Users ----------------------------------------------------------
    getUsers = asyncHandler (async (req: Request, res: Response) => {
        if (!req.admin) throw new ForbiddenError();
        const page = parseInt(req.query["page"] as string ?? "1");
        const limit = parseInt(req.query["limit"] as string ?? "20");
        const result = await adminStatsService.getUsers(page, limit);
        return sendSuccess(res, 200, result, "Users retrieved successfully");
    });

   //---- Transactions ----------------------------------------------------------
    getTransactions = asyncHandler (async (req: Request, res: Response) => {
        if (!req.admin) throw new ForbiddenError();
        const page = parseInt(req.query["page"] as string ?? "1");
        const limit = parseInt(req.query["limit"] as string ?? "20");
        const result = await adminStatsService.getTransactions(page, limit);
        return sendSuccess(res, 200, result, "Transactions retrieved successfully");
    });
}

export const adminController = new AdminController();