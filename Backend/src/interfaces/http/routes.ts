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
} from "./validators/auth.validators";

const router = Router();

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
    "/auth/refresh",
    authRateLimit,
    validate(refreshSchema),
    authController.refresh
);

router.post(
    "auth/logout",
    validate(logoutSchema),
    authController.logout
);


//---- Wallet routes ------------------------------------------------------------------------------------------------------
router.get("/wallets", authenticate, walletController.listwallets);


export { router };