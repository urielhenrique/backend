import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { loginLimiter } from "../../shared/middlewares/security.middleware";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", loginLimiter, (req, res) => controller.login(req, res));
router.post("/google", loginLimiter, (req, res) =>
  controller.googleLogin(req, res),
);
router.get("/me", authMiddleware, (req, res) => controller.me(req, res));

export default router;
