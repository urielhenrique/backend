"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const emailVerification_controller_1 = __importDefault(require("./emailVerification.controller"));
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const security_middleware_1 = require("../../shared/middlewares/security.middleware");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
// Rotas públicas
router.get("/csrf-token", (req, res) => controller.getCsrfToken(req, res));
router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", security_middleware_1.loginLimiter, (req, res) => controller.login(req, res));
router.post("/google", security_middleware_1.loginLimiter, (req, res) => controller.googleLogin(req, res));
// Email Verification Routes
router.post("/send-verification-email", (req, res) => emailVerification_controller_1.default.resendVerificationEmail(req, res));
router.get("/verify-email", (req, res) => emailVerification_controller_1.default.verifyEmail(req, res));
// Password Reset Routes
router.post("/forgot-password", security_middleware_1.forgotPasswordLimiter, (req, res) => emailVerification_controller_1.default.forgotPassword(req, res));
router.post("/reset-password", (req, res) => emailVerification_controller_1.default.resetPassword(req, res));
// ⚠️ TESTE - Endpoints apenas para desenvolvimento (desabilitados em produção)
if (process.env.NODE_ENV !== "production") {
    // TESTE - Endpoint para obter token de verificação RAW (remover em produção)
    router.get("/test/get-verification-token/:email", async (req, res) => {
        try {
            const prisma = require("../../shared/database/prisma").default;
            const { generateToken, hashToken, getExpirationDate, } = require("../../shared/utils/token.utils");
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    // TESTE - Endpoint para obter token de reset password RAW (remover em produção)
    router.get("/test/get-reset-token/:email", async (req, res) => {
        try {
            const prisma = require("../../shared/database/prisma").default;
            const { generateToken, hashToken, getExpirationDate, } = require("../../shared/utils/token.utils");
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}
// Rotas protegidas
router.get("/me", auth_middleware_1.authMiddleware, (req, res) => controller.me(req, res));
router.post("/logout", auth_middleware_1.authMiddleware, (req, res) => controller.logout(req, res));
exports.default = router;
