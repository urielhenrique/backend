import { Router } from "express";
import { PlanoController } from "./plano.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new PlanoController();

router.use(authMiddleware);

/**
 * GET /plano/limites
 * Retorna apenas os limites do plano
 */
router.get("/limites", (req, res) => controller.getLimites(req, res));

/**
 * GET /plano/uso
 * Retorna apenas o uso atual de recursos
 */
router.get("/uso", (req, res) => controller.getUso(req, res));

/**
 * GET /plano/status
 * Retorna status completo: limites + uso + percentuais + alertas
 */
router.get("/status", (req, res) => controller.getStatus(req, res));

export default router;
