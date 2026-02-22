import { Router, Request, Response } from "express";
import {
  authMiddleware,
  requireSystemAdmin,
  AuthRequest,
} from "../../shared/middlewares/auth.middleware";
import prisma from "../../shared/database/prisma";

const router = Router();

/**
 * GET /admin/dashboard
 * Retorna estatísticas do sistema (apenas admin do sistema)
 */
router.get(
  "/dashboard",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const totalEstabelecimentos = await prisma.estabelecimento.count();
      const freeEstabelecimentos = await prisma.estabelecimento.count({
        where: { plano: "FREE" },
      });
      const proEstabelecimentos = await prisma.estabelecimento.count({
        where: { plano: "PRO" },
      });

      const totalUsuarios = await prisma.usuario.count();
      const totalProdutos = await prisma.produto.count();
      const totalMovimentacoes = await prisma.movimentacao.count();

      // Subscriptions ativas
      const activeSubscriptions = await prisma.subscription.count({
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
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  },
);

/**
 * GET /admin/users
 * Lista todos os usuários/estabelecimentos (com paginação)
 */
router.get(
  "/users",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [estabelecimentos, total] = await Promise.all([
        prisma.estabelecimento.findMany({
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
        prisma.estabelecimento.count(),
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
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  },
);

/**
 * GET /admin/users/plan/:plan
 * Filtra usuários por plano
 */
router.get(
  "/users/plan/:plan",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const plan = String(req.params.plan);

      if (!["FREE", "PRO"].includes(plan.toUpperCase())) {
        return res.status(400).json({
          error: "INVALID_PLAN",
          message: "Plano inválido. Use 'FREE' ou 'PRO'",
        });
      }

      const estabelecimentos = await prisma.estabelecimento.findMany({
        where: { plano: plan.toUpperCase() as "FREE" | "PRO" },
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
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  },
);

/**
 * DELETE /admin/estabelecimento/:id
 * Desativar estabelecimento (soft delete)
 */
router.delete(
  "/estabelecimento/:id",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      await prisma.estabelecimento.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({ message: "Estabelecimento desativado com sucesso" });
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  },
);

/**
 * POST /admin/estabelecimento/:id/activate
 * Reativar estabelecimento
 */
router.post(
  "/estabelecimento/:id/activate",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      await prisma.estabelecimento.update({
        where: { id },
        data: { ativo: true },
      });

      res.json({ message: "Estabelecimento reativado com sucesso" });
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  },
);

/**
 * DELETE /admin/estabelecimento/:id
 * Desativar estabelecimento
 */
router.delete(
  "/estabelecimento/:id",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      const updated = await prisma.estabelecimento.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        message: "Estabelecimento desativado",
        estabelecimento: updated,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
