import { Router, Request, Response } from "express";
import {
  authMiddleware,
  AuthRequest,
} from "../../shared/middlewares/auth.middleware";
import prisma from "../../shared/database/prisma";

const router = Router();

/**
 * Middleware: Verificar se usuário é ADMIN do sistema
 */
const isSystemAdmin = async (
  req: AuthRequest,
  res: Response,
  next: Function,
) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
    });

    // Por simplicidade, verificamos se o primeiro usuário é ADMIN
    // Em produção, adicione um campo "isSystemAdmin" no banco
    if (user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Acesso negado. Apenas admin pode acessar." });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /admin/dashboard
 * Retorna estatísticas do sistema
 */
router.get(
  "/dashboard",
  authMiddleware,
  isSystemAdmin,
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

      res.json({
        totalEstabelecimentos,
        freeEstabelecimentos,
        proEstabelecimentos,
        totalUsuarios,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /admin/users
 * Lista todos os usuários/estabelecimentos
 */
router.get(
  "/users",
  authMiddleware,
  isSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const estabelecimentos = await prisma.estabelecimento.findMany({
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

      const users = estabelecimentos.map((est) => ({
        estabelecimentoId: est.id,
        estabelecimentoNome: est.nome,
        plano: est.plano,
        ativo: est.ativo,
        criadoEm: est.createdAt,
        usuarios: est.usuarios,
      }));

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
  isSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { plan } = req.params;

      if (!["FREE", "PRO"].includes(plan.toUpperCase())) {
        return res
          .status(400)
          .json({ error: "Plano inválido. Use 'FREE' ou 'PRO'" });
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
      });

      res.json({
        plan: plan.toUpperCase(),
        total: estabelecimentos.length,
        estabelecimentos,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /admin/users/online
 * Simula usuários online (baseado em último acesso)
 * Em produção, implemente rastreamento real de sessões
 */
router.get(
  "/users/online",
  authMiddleware,
  isSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      // Para simplificar, retornamos usuários criados nos últimos 30 minutos
      const umMinutoAtras = new Date(Date.now() - 30 * 60 * 1000);

      const usuariosRecentes = await prisma.usuario.findMany({
        where: {
          createdAt: {
            gte: umMinutoAtras,
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          estabelecimento: {
            select: {
              nome: true,
              plano: true,
            },
          },
        },
      });

      res.json({
        usuariosOnline: usuariosRecentes.length,
        usuarios: usuariosRecentes,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
  isSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

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
