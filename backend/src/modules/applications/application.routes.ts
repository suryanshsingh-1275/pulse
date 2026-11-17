import { Router } from "express";
import { loadOwnedApp } from "../../middleware/ownedApp";
import { validate } from "../../middleware/validate";
import alertsRoutes from "../alerts/alerts.routes";
import errorsRoutes from "../errors/errors.routes";
import logsRoutes from "../logs/logs.routes";
import metricsRoutes from "../metrics/metrics.routes";
import * as c from "./application.controller";

const router = Router();

router.get("/", c.list);
router.post("/", validate(c.createSchema), c.create);

// everything below is tenant-isolated
router.use("/:appId", loadOwnedApp);
router.get("/:appId", c.get);
router.patch("/:appId", validate(c.updateSchema), c.update);
router.delete("/:appId", c.remove);
router.post("/:appId/rotate-key", c.rotateKey);

router.use("/:appId/metrics", metricsRoutes);
router.use("/:appId/errors", errorsRoutes);
router.use("/:appId/logs", logsRoutes);
router.use("/:appId/alerts", alertsRoutes);

export default router;