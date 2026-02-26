"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Endpoint para testar requireSystemAdmin middleware
 * GET /seed/test-system-admin
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/test-system-admin", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    res.json({
        success: true,
        message: "✅ Middleware requireSystemAdmin passou!",
        user: req.user,
    });
});
/**
 * Endpoint para verificar autenticação
 * GET /seed/verify-auth
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/verify-auth", auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const myAdminEmail = process.env.MY_ADMIN_EMAIL;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Não autenticado",
            });
        }
        // Buscar usuário no banco
        const userInDb = await prisma_1.default.usuario.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
            },
        });
        const isAdmin = user && myAdminEmail && user.userId && userInDb;
        res.json({
            success: true,
            authenticated: true,
            userFromToken: user,
            userFromDatabase: userInDb,
            myAdminEmailFromEnv: myAdminEmail,
            emailMatch: userInDb?.email === myAdminEmail,
            hasAdminRole: userInDb?.role === "ADMIN",
            message: isAdmin ? "✅ Autenticado como ADMIN!" : "❌ Não é admin",
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
/**
 * Endpoint para criar usuario ADMIN
 * GET /seed/create-admin
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/create-admin", async (req, res) => {
    try {
        const nomeEstabelecimento = "Bar Stock Pro";
        const nome = "Administrador";
        const email = "admin@barstock.com.br";
        const senha = "Admin@123456";
        const senhaHash = await bcrypt_1.default.hash(senha, 10);
        const estabelecimento = await prisma_1.default.estabelecimento.create({
            data: {
                nome: nomeEstabelecimento,
                usuarios: {
                    create: {
                        nome,
                        email,
                        senhaHash,
                        role: "ADMIN",
                    },
                },
            },
            include: { usuarios: true },
        });
        res.json({
            success: true,
            message: "✅ Usuário ADMIN criado com sucesso!",
            data: {
                email: email,
                senha: senha,
                estabelecimento: nomeEstabelecimento,
            },
        });
    }
    catch (error) {
        console.error("❌ Erro ao criar admin:", error.message);
        res.status(400).json({
            success: false,
            message: "Erro ao criar admin",
            error: error.message,
        });
    }
});
/**
 * Endpoint para listar usuários (DEBUG)
 * GET /seed/list-users
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/list-users", async (req, res) => {
    try {
        const myAdminEmail = process.env.MY_ADMIN_EMAIL;
        const usuarios = await prisma_1.default.usuario.findMany({
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
            },
            orderBy: { email: "asc" },
        });
        res.json({
            success: true,
            count: usuarios.length,
            myAdminEmailFromEnv: myAdminEmail,
            usuarios,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
/**
 * Endpoint para atualizar email do admin
 * GET /seed/update-admin-email
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/update-admin-email", async (req, res) => {
    try {
        const oldEmail = "admin@barstock.com.br";
        const newEmail = "uriel.henrique.gomes.uh@gmail.com";
        const result = await prisma_1.default.usuario.updateMany({
            where: { email: oldEmail },
            data: { email: newEmail },
        });
        res.json({
            success: true,
            message: `✅ ${result.count} usuário(s) atualizado(s)!`,
            oldEmail,
            newEmail,
        });
    }
    catch (error) {
        console.error("❌ Erro ao atualizar email:", error.message);
        res.status(400).json({
            success: false,
            message: "Erro ao atualizar email",
            error: error.message,
        });
    }
});
/**
 * Endpoint para resetar senha do admin
 * GET /seed/reset-password
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/reset-password", async (req, res) => {
    try {
        const email = "uriel.henrique.gomes.uh@gmail.com";
        const novaSenha = "Admin@123456";
        const senhaHash = await bcrypt_1.default.hash(novaSenha, 10);
        const usuario = await prisma_1.default.usuario.update({
            where: { email },
            data: {
                senhaHash,
                role: "ADMIN", // Garante que é ADMIN
            },
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
            },
        });
        res.json({
            success: true,
            message: "✅ Senha resetada e role atualizado para ADMIN!",
            usuario,
            senhaTemporaria: novaSenha,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
/**
 * Endpoint para garantir que admin está correto
 * GET /seed/fix-admin
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/fix-admin", async (req, res) => {
    try {
        const email = "uriel.henrique.gomes.uh@gmail.com";
        const novaSenha = "Admin@123456";
        const senhaHash = await bcrypt_1.default.hash(novaSenha, 10);
        // Atualizar usuario (garantir que existe e é ADMIN)
        const usuario = await prisma_1.default.usuario.update({
            where: { email },
            data: {
                senhaHash,
                role: "ADMIN",
                nome: "System Admin",
                // Mantém o estabelecimentoId existente
            },
            select: {
                id: true,
                email: true,
                nome: true,
                role: true,
                estabelecimentoId: true,
            },
        });
        res.json({
            success: true,
            message: "✅ Admin configurado com sucesso!",
            usuario,
            credentials: {
                email,
                senha: novaSenha,
            },
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
