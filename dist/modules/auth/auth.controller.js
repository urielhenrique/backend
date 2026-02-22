"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const { nomeEstabelecimento, nome, email, senha } = req.body;
            const result = await authService.register(nomeEstabelecimento, nome, email, senha);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({
                error: "REGISTRATION_FAILED",
                message: error.message,
            });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({
                error: "LOGIN_FAILED",
                message: error.message,
            });
        }
    }
    /**
     * Google Auth - POST /auth/google
     */
    async googleLogin(req, res) {
        try {
            const { idToken, credential } = req.body;
            // Aceita tanto idToken quanto credential
            const token = idToken || credential;
            if (!token) {
                return res.status(400).json({
                    error: "MISSING_TOKEN",
                    message: "Token do Google obrigatório",
                });
            }
            const result = await authService.googleAuth(token);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({
                error: "GOOGLE_AUTH_FAILED",
                message: error.message,
            });
        }
    }
    async me(req, res) {
        try {
            const user = await prisma_1.default.usuario.findUnique({
                where: { id: req.user.userId },
                include: { estabelecimento: true },
            });
            if (!user) {
                return res.status(404).json({
                    error: "USER_NOT_FOUND",
                    message: "Usuário não encontrado",
                });
            }
            res.json({
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.role,
                estabelecimento_id: user.estabelecimentoId,
                estabelecimento_nome: user.estabelecimento.nome,
                plano: user.estabelecimento.plano,
            });
        }
        catch (error) {
            res.status(500).json({
                error: "INTERNAL_ERROR",
                message: error.message,
            });
        }
    }
}
exports.AuthController = AuthController;
