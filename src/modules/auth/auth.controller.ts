import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import prisma from "../../shared/database/prisma";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { nomeEstabelecimento, nome, email, senha } = req.body;

      const result = await authService.register(
        nomeEstabelecimento,
        nome,
        email,
        senha,
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: "REGISTRATION_FAILED",
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: "LOGIN_FAILED",
        message: error.message,
      });
    }
  }

  /**
   * Google Auth - POST /auth/google
   */
  async googleLogin(req: Request, res: Response) {
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
    } catch (error: any) {
      res.status(400).json({
        error: "GOOGLE_AUTH_FAILED",
        message: error.message,
      });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { id: req.user!.userId },
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
    } catch (error: any) {
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: error.message,
      });
    }
  }
}
