import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { FornecedorController } from "./fornecedor.controller";

const router = Router();
const controller = new FornecedorController();

router.use(authMiddleware);

router.get("/", (req, res) => controller.findAll(req, res));
router.post("/", (req, res) => controller.create(req, res));
router.put("/:id", (req, res) => controller.update(req, res));
router.delete("/:id", (req, res) => controller.delete(req, res));

export default router;
