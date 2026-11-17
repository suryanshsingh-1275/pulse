import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as controller from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";

const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 50, standardHeaders: true, legacyHeaders: false });

const router = Router();
router.post("/register", limiter, validate(registerSchema), controller.register);
router.post("/login", limiter, validate(loginSchema), controller.login);
router.get("/me", requireAuth, controller.me);

export default router;