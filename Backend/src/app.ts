import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

import { router } from "./interfaces/http/routes";
import { errorHandler } from "./interfaces/http/middleware/error-handler";
import { generalRateLimit } from "./interfaces/http/middleware/rate-limit";
import { sendError } from "./shared/http-response";
import { logger } from "./config/logger";
import { env } from "./config/env";


export function createApp(): Application {
    const app = express();

    //--- Security & parsing --------------------------------------------------------------------------------------------------
    app.use(helmet());
    app.use(
        cors({
            origin: env.CORS_ORIGINS,
            credentials: true,
        })
    );
    app.use(compression());
    app.use(morgan(env.NODE_ENV === "development" ? "dev": "combined"));
    app.use(express.json());
    app.use(generalRateLimit);

    //---- Health check ---------------------------------------------------------------------------------------------------------
    app.get("/health", (_req: Request, res: Response) => {
        res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
    });

    //----- API docs ------------------------------------------------------------------------------------------------------------
    try{
    const openapiPath = path.join(__dirname, "../docs/apenapi.yaml");
    const swaggerDocument = YAML.load(openapiPath);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (error) {
        logger.warn("OpenAPI spec not found -- /api-docs disabled until docs/apenapi.yaml exists");
    }
    //----- API routes ---------------------------------------------------------------------------------------------------------
    app.use("api/v1", router);

    //---- 404 handler ----------------------------------------------------------------------------------------------------------
    app.use((req: Request, res: Response) => {
        sendError(res, 404, `Route ${req.method} ${req.path} not found.`, "NOT_FOUND")
    })


    //----- Error handler -----------------------------------------------------------------------------------------------------
    app.use(errorHandler);


    return app;
}