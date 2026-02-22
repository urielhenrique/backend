"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const router = (0, express_1.Router)();
/**
 * GET /admin/dashboard
 * Retorna estatísticas do sistema (apenas admin do sistema)
 */
router.get("/dashboard", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const totalEstabelecimentos = await prisma_1.default.estabelecimento.count();
        const freeEstabelecimentos = await prisma_1.default.estabelecimento.count({
            where: { plano: "FREE" },
        });
        const proEstabelecimentos = await prisma_1.default.estabelecimento.count({
            where: { plano: "PRO" },
        });
        const totalUsuarios = await prisma_1.default.usuario.count();
        const totalProdutos = await prisma_1.default.produto.count();
        const totalMovimentacoes = await prisma_1.default.movimentacao.count();
        // Subscriptions ativas
        const activeSubscriptions = await prisma_1.default.subscription.count({
            where: { status: "active" },
        });
        // Receita mensal (assumindo R$ 49,90 por assinatura PRO)
        const monthlyRevenue = proEstabelecimentos * 49.9;
        res.json({
            totalEstabelecimentos,
            freeEstabelecimentos,
            proEstabelecimentos,
            totalUsuarios,
            totalProdutos,
            totalMovimentacoes,
            activeSubscriptions,
            monthlyRevenue: monthlyRevenue.toFixed(2),
        });
    }
    catch (error) {
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
});
/**
 * GET /admin/users
 * Lista todos os usuários/estabelecimentos (com paginação)
 */
router.get("/users", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [estabelecimentos, total] = await Promise.all([
            prisma_1.default.estabelecimento.findMany({
                include: {
                    usuarios: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                    subscriptions: {
                        where: { status: { in: ["active", "trialing"] } },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma_1.default.estabelecimento.count(),
        ]);
        const users = estabelecimentos.map((est) => ({
            estabelecimentoId: est.id,
            estabelecimentoNome: est.nome,
            plano: est.plano,
            ativo: est.ativo,
            stripeCustomerId: est.stripeCustomerId,
            criadoEm: est.createdAt,
            usuarios: est.usuarios,
            subscription: est.subscriptions[0] || null,
        }));
        res.json({
            data: users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
});
/**
 * GET /admin/users/plan/:plan
 * Filtra usuários por plano
 */
router.get("/users/plan/:plan", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const plan = String(req.params.plan);
        if (!["FREE", "PRO"].includes(plan.toUpperCase())) {
            return res.status(400).json({
                error: "INVALID_PLAN",
                message: "Plano inválido. Use 'FREE' ou 'PRO'",
            });
        }
        const estabelecimentos = await prisma_1.default.estabelecimento.findMany({
            where: { plano: plan.toUpperCase() },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({
            plan: plan.toUpperCase(),
            total: estabelecimentos.length,
            estabelecimentos,
        });
    }
    catch (error) {
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
});
/**
 * DELETE /admin/estabelecimento/:id
 * Desativar estabelecimento (soft delete)
 */
router.delete("/estabelecimento/:id", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.estabelecimento.update({
            where: { id },
            data: { ativo: false },
        });
        res.json({ message: "Estabelecimento desativado com sucesso" });
    }
    catch (error) {
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
});
/**
 * POST /admin/estabelecimento/:id/activate
 * Reativar estabelecimento
 */
router.post("/estabelecimento/:id/activate", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.estabelecimento.update({
            where: { id },
            data: { ativo: true },
        });
        res.json({ message: "Estabelecimento reativado com sucesso" });
    }
    catch (error) {
        res.status(500).json({
            error: "INTERNAL_ERROR",
            message: error.message,
        });
    }
});
/**
 * DELETE /admin/estabelecimento/:id
 * Desativar estabelecimento
 */
router.delete("/estabelecimento/:id", auth_middleware_1.authMiddleware, auth_middleware_1.requireSystemAdmin, async (req, res) => {
    try {
        const id = String(req.params.id);
        const updated = await prisma_1.default.estabelecimento.update({
            where: { id },
            data: { ativo: false },
        });
        res.json({
            message: "Estabelecimento desativado",
            estabelecimento: updated,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
