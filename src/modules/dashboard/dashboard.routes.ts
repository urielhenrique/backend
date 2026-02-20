import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new DashboardController();

router.use(authMiddleware);

router.get("/", (req, res) => controller.get(req, res));

export default router;
