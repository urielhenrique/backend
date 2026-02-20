import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new AuthController();

router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", (req, res) => controller.login(req, res));
router.get("/me", authMiddleware, (req, res) => controller.me(req, res));

export default router;
