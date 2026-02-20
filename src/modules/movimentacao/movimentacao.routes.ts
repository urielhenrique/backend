import { Router } from "express";
import { MovimentacaoController } from "./movimentacao.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new MovimentacaoController();

router.use(authMiddleware);

router.post("/", (req, res) => controller.create(req, res));
router.get("/", (req, res) => controller.findAll(req, res));

export default router;
