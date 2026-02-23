import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { loginLimiter } from "../../shared/middlewares/security.middleware";

const router = Router();
const controller = new AuthController();

// Rotas públicas
router.get("/csrf-token", (req, res) => controller.getCsrfToken(req, res));
router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", loginLimiter, (req, res) => controller.login(req, res));
router.post("/google", loginLimiter, (req, res) =>
  controller.googleLogin(req, res),
);

// Rotas protegidas
router.get("/me", authMiddleware, (req, res) => controller.me(req, res));
router.post("/logout", authMiddleware, (req, res) =>
  controller.logout(req, res),
);

export default router;
