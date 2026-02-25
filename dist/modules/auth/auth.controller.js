"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const systemEvent_service_1 = __importDefault(require("../../shared/services/systemEvent.service"));
const cookie_config_1 = require("../../shared/utils/cookie.config");
const authService = new auth_service_1.AuthService();
class AuthController {
    /**
     * Helper: Define cookies de autenticação
     */
    setAuthCookies(res, token, refreshToken) {
        res.cookie(cookie_config_1.COOKIE_NAMES.ACCESS_TOKEN, token, cookie_config_1.ACCESS_TOKEN_COOKIE_OPTIONS);
        res.cookie(cookie_config_1.COOKIE_NAMES.REFRESH_TOKEN, refreshToken, cookie_config_1.REFRESH_TOKEN_COOKIE_OPTIONS);
    }
    /**
     * Helper: Limpa cookies de autenticação
     */
    clearAuthCookies(res) {
        res.clearCookie(cookie_config_1.COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
        res.clearCookie(cookie_config_1.COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });
    }
    async register(req, res) {
        try {
            console.log("📝 Recebendo registro:", req.body);
            // Normalizar campos: aceitar tanto camelCase quanto snake_case
            const nomeEstabelecimento = req.body.nomeEstabelecimento || req.body.nome_estabelecimento;
            const nome = req.body.nome;
            const email = req.body.email;
            const senha = req.body.senha || req.body.password;
            console.log("✅ Campos normalizados:", {
                nomeEstabelecimento,
                nome,
                email,
                senha: "***",
            });
            const result = await authService.register(nomeEstabelecimento, nome, email, senha);
            // Define cookies httpOnly
            this.setAuthCookies(res, result.token, result.refreshToken);
            // Retorna dados do usuário sem tokens
            res.json({
                user: result.user,
            });
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
            // Define cookies httpOnly
            this.setAuthCookies(res, result.token, result.refreshToken);
            // Log login event
            await systemEvent_service_1.default.logEvent({
                eventType: "login",
                userId: result.user.id,
                estabelecimentoId: result.user.estabelecimento_id,
                metadata: {
                    action: "user_login",
                },
            });
            // Retorna dados do usuário sem tokens
            res.json({
                user: result.user,
            });
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
            // Define cookies httpOnly
            this.setAuthCookies(res, result.token, result.refreshToken);
            // Log login event
            await systemEvent_service_1.default.logEvent({
                eventType: "login",
                userId: result.user.id,
                estabelecimentoId: result.user.estabelecimento_id,
                metadata: {
                    action: "google_login",
                },
            });
            // Retorna dados do usuário sem tokens
            res.json({
                user: result.user,
            });
        }
        catch (error) {
            res.status(400).json({
                error: "GOOGLE_AUTH_FAILED",
                message: error.message,
            });
        }
    }
    /**
     * Logout - POST /auth/logout
     */
    async logout(req, res) {
        try {
            // Limpa cookies
            this.clearAuthCookies(res);
            // TODO: Invalidar refresh token no banco de dados
            // Implementar blacklist de tokens se necessário
            res.json({
                message: "Logout realizado com sucesso",
            });
        }
        catch (error) {
            res.status(500).json({
                error: "LOGOUT_FAILED",
                message: error.message,
            });
        }
    }
    /**
     * CSRF Token - GET /auth/csrf-token
     */
    getCsrfToken(req, res) {
        try {
            // Gera token CSRF (csurf middleware injeta req.csrfToken em requisições GET)
            const csrfToken = req.csrfToken ? req.csrfToken() : undefined;
            if (!csrfToken) {
                return res.status(500).json({
                    error: "CSRF_TOKEN_ERROR",
                    message: "Falha ao gerar token CSRF",
                });
            }
            res.json({
                csrfToken,
            });
        }
        catch (error) {
            console.error("Erro ao gerar CSRF token:", error);
            res.status(500).json({
                error: "CSRF_TOKEN_ERROR",
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
            // Admin de sistema pode não ter estabelecimento
            res.json({
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.role,
                estabelecimento_id: user.estabelecimentoId || null,
                estabelecimento_nome: user.estabelecimento?.nome || null,
                plano: user.estabelecimento?.plano || null,
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
