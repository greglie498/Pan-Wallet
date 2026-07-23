import { Router } from "express";
import { authController } from "./controllers/auth.controller";
import { walletController } from "./controllers/wallet.controller";
import { authenticate } from "./middleware/authenticate";
import { authRateLimit } from "./middleware/rate-limit";
import { validate } from "./middleware/validate";
import{
    registerSchema,
    loginSchema,
    refreshSchema,
    logoutSchema,
    firebaseAuthSchema
} from "./validators/auth.validators";
import { linkWalletSchema, topUpSchema } from "./validators/wallet.validators";
import { transactionController } from "./controllers/transaction.controller";
import {
    getQuoteSchema,
    initiateTransferSchema,
} from "./validators/transaction.validators";
import { adminLoginSchema } from "./validators/admin .validators";
import { adminController } from "./controllers/admin.controller";
import { authenticateAdmin } from "./middleware/authenticate-admin";

const router = Router();

//------- Admin routes --------------------------------------------------------------------------------------------------------------
router.post(
    "/admin/login",
    authRateLimit,
    validate(adminLoginSchema),
    adminController.login
);

router.get(
    "/admin/stats",
    authenticateAdmin,
    adminController.getStats
);

router.get(
    "/admin/users",
    authenticateAdmin,
    adminController.getUsers
);

router.get(
    "/admin/transactions",
    authenticateAdmin,
    adminController.getTransactions
);


//------- Auth routes ----------------------------------------------------------------------------------------------------------------
router.post(
    "/auth/register",
    authRateLimit,
    validate(registerSchema),
    authController.register
);

router.post(
    "/auth/login",
    authRateLimit,
    validate(loginSchema),
    authController.login
);

router.post(
    "/auth/firebase",
    authRateLimit,
    validate(firebaseAuthSchema),
    authController.firebaseLogin
);

router.post(
    "/auth/refresh",
    authRateLimit,
    validate(refreshSchema),
    authController.refresh
);

router.post(
    "/auth/logout",
    validate(logoutSchema),
    authController.logout
);


//---- Wallet routes ------------------------------------------------------------------------------------------------------
router.get(
    "/wallets", 
    authenticate, 
    walletController.listwallets
);

router.get(
    "/wallets/:walletId",
    authenticate,
    walletController.getWallet
);

router.post(
    "/wallets/link",
    authenticate,
    walletController.linkWallet
);

router.post(
    "/wallets/:walletId/topup",
    authenticate,
    validate(topUpSchema),
    walletController.topUp
)

router.delete(
    "wallets/:walletId/unlink",
    authenticate,
    walletController.unlinkWallet
);


//------ Transaction routes ------------------------------------------------------------------------------------------------
router.post(
    "/transactions/quote",
    authenticate,
    validate(getQuoteSchema),
    transactionController.getQuote
);

router.post(
    "/transactions",
    authenticate,
    transactionController.initiateTransfer
);

router.get(
    "/transactions",
    authenticate,
    transactionController.listTransactions
);

router.get(
    "/transactions/:transactionId",
    authenticate,
    transactionController.getTransaction
);


//----- Provider callbacks (no auth - calls by providers) ---------------------------------------------------------------------------
router.post(
    "/transactions/mpesa/callback",
    transactionController.mpesaCallback
);

router.post(
    "/transactions/mtn/callback",
    transactionController.mtnCallback
);


export { router };