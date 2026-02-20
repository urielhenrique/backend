import { Router } from "express";
import { ProdutoController } from "./produto.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";

const router = Router();
const controller = new ProdutoController();

router.use(authMiddleware);

router.post("/", (req, res) => controller.create(req, res));
router.get("/", (req, res) => controller.findAll(req, res));
router.put("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.delete(req, res));

export default router;
