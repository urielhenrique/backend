import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../database/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const MY_ADMIN_EMAIL = process.env.MY_ADMIN_EMAIL;

interface TokenPayload {
  userId: string;
  estabelecimentoId: string;
  role: "ADMIN" | "FUNCIONARIO";
}

export type AuthRequest = Request & {
  user?: TokenPayload;
};

/**
 * Middleware de autenticação básica
 * Verifica JWT token
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Token não fornecido",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "INVALID_TOKEN",
      message: "Token inválido ou expirado",
    });
  }
}

/**
 * Middleware: Requer que o usuário seja ADMIN do estabelecimento
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Autenticação necessária",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Acesso negado. Apenas administradores.",
    });
  }

  next();
};

/**
 * Middleware: Requer que o usuário seja ADMIN do sistema (via MY_ADMIN_EMAIL)
 * Para dashboard administrativo global
 */
export const requireSystemAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Autenticação necessária",
    });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "Usuário não encontrado",
      });
    }

    // Verifica se é o admin do sistema via email
    const isSystemAdmin = MY_ADMIN_EMAIL && user.email === MY_ADMIN_EMAIL;

    if (!isSystemAdmin) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Acesso negado. Apenas administrador do sistema.",
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/**
 * Middleware: Requer plano PRO
 */
export const requireProPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Autenticação necessária",
    });
  }

  try {
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id: req.user.estabelecimentoId },
    });

    if (!estabelecimento) {
      return res.status(404).json({
        error: "ESTABLISHMENT_NOT_FOUND",
        message: "Estabelecimento não encontrado",
      });
    }

    if (estabelecimento.plano !== "PRO") {
      return res.status(403).json({
        error: "PLAN_UPGRADE_REQUIRED",
        message: "Esta funcionalidade requer plano PRO",
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error.message,
    });
  }
};

/**
 * Middleware: Verificar limite do plano
 * Usado antes de criar recursos (produtos, usuários, etc)
 */
export const enforcePlanLimit = (
  resourceType: "produto" | "usuario" | "movimentacao",
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    try {
      const planoService = (await import("../services/plano.service"))
        .PlanoService;
      const service = new planoService();

      await service.checkLimite(req.user.estabelecimentoId, resourceType);
      next();
    } catch (error: any) {
      // Se é erro de limite, retorna com código específico
      if (error.message.includes("Limite do plano")) {
        return res.status(403).json({
          error: "PLAN_LIMIT_REACHED",
          message: error.message,
          upgradeRequired: true,
        });
      }

      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  };
};
