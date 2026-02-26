import { Router } from "express";
import { AuthController } from "./auth.controller";
import emailVerificationController from "./emailVerification.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import {
  loginLimiter,
  forgotPasswordLimiter,
} from "../../shared/middlewares/security.middleware";

const router = Router();
const controller = new AuthController();

// Rotas públicas
router.get("/csrf-token", (req, res) => controller.getCsrfToken(req, res));
router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", loginLimiter, (req, res) => controller.login(req, res));
router.post("/google", loginLimiter, (req, res) =>
  controller.googleLogin(req, res),
);

// Email Verification Routes
router.post("/send-verification-email", (req, res) =>
  emailVerificationController.resendVerificationEmail(req, res),
);
router.get("/verify-email", (req, res) =>
  emailVerificationController.verifyEmail(req, res),
);

// Password Reset Routes
router.post("/forgot-password", forgotPasswordLimiter, (req, res) =>
  emailVerificationController.forgotPassword(req, res),
);
router.post("/reset-password", (req, res) =>
  emailVerificationController.resetPassword(req, res),
);

// ⚠️ TESTE - Endpoints apenas para desenvolvimento (desabilitados em produção)
if (process.env.NODE_ENV !== "production") {
  // TESTE - Endpoint para obter token de verificação RAW (remover em produção)
  router.get("/test/get-verification-token/:email", async (req, res) => {
    try {
      const prisma = require("../../shared/database/prisma").default;
      const {
        generateToken,
        hashToken,
        getExpirationDate,
      } = require("../../shared/utils/token.utils");

      const user = await prisma.usuario.findUnique({
        where: { email: req.params.email },
        select: { id: true, emailVerificationToken: true },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Gerar novo token RAW para testes
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      // Atualizar no banco
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: getExpirationDate(60),
        },
      });

      res.json({
        emailVerificationToken: rawToken,
        note: "Token RAW gerado para testes. Use este para verificar email.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // TESTE - Endpoint para obter token de reset password RAW (remover em produção)
  router.get("/test/get-reset-token/:email", async (req, res) => {
    try {
      const prisma = require("../../shared/database/prisma").default;
      const {
        generateToken,
        hashToken,
        getExpirationDate,
      } = require("../../shared/utils/token.utils");

      const user = await prisma.usuario.findUnique({
        where: { email: req.params.email },
        select: { id: true, passwordResetToken: true },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Gerar novo token RAW para testes
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);

      // Atualizar no banco
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: getExpirationDate(60),
        },
      });

      res.json({
        passwordResetToken: rawToken,
        note: "Token RAW gerado para testes. Use este para resetar senha.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Rotas protegidas
router.get("/me", authMiddleware, (req, res) => controller.me(req, res));
router.post("/logout", authMiddleware, (req, res) =>
  controller.logout(req, res),
);

export default router;
