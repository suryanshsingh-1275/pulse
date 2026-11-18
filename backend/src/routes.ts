import { Router } from "express";
import { requireAuth } from "./middleware/auth";
import applicationRoutes from "./modules/applications/application.routes";
import authRoutes from "./modules/auth/auth.routes";
import telemetryRoutes from "./modules/telemetry/telemetry.routes";

const router = Router();
router.use("/auth", authRoutes);
router.use("/ingest", telemetryRoutes); // authenticated by API key
router.use("/apps", requireAuth, applicationRoutes); // authenticated by JWT

export default router;