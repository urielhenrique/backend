import { Router } from "express";
import {
  authMiddleware,
  AuthRequest,
} from "../../shared/middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    message: "Acesso autorizado",
    user: req.user,
  });
});

export default router;
