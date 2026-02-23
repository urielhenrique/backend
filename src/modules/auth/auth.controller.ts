import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import prisma from "../../shared/database/prisma";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";
import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  COOKIE_NAMES,
} from "../../shared/utils/cookie.config";

const authService = new AuthService();

export class AuthController {
  /**
   * Helper: Define cookies de autenticação
   */
  private setAuthCookies(res: Response, token: string, refreshToken: string) {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      REFRESH_TOKEN_COOKIE_OPTIONS,
    );
  }

  /**
   * Helper: Limpa cookies de autenticação
   */
  private clearAuthCookies(res: Response) {
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: "/" });
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });
  }

  async register(req: Request, res: Response) {
    try {
      const { nomeEstabelecimento, nome, email, senha } = req.body;

      const result = await authService.register(
        nomeEstabelecimento,
        nome,
        email,
        senha,
      );

      // Define cookies httpOnly
      this.setAuthCookies(res, result.token, result.refreshToken);

      // Retorna dados do usuário sem tokens
      res.json({
        user: result.user,
      });
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

      // Define cookies httpOnly
      this.setAuthCookies(res, result.token, result.refreshToken);

      // Retorna dados do usuário sem tokens
      res.json({
        user: result.user,
      });
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

      // Define cookies httpOnly
      this.setAuthCookies(res, result.token, result.refreshToken);

      // Retorna dados do usuário sem tokens
      res.json({
        user: result.user,
      });
    } catch (error: any) {
      res.status(400).json({
        error: "GOOGLE_AUTH_FAILED",
        message: error.message,
      });
    }
  }

  /**
   * Logout - POST /auth/logout
   */
  async logout(req: AuthRequest, res: Response) {
    try {
      // Limpa cookies
      this.clearAuthCookies(res);

      // TODO: Invalidar refresh token no banco de dados
      // Implementar blacklist de tokens se necessário

      res.json({
        message: "Logout realizado com sucesso",
      });
    } catch (error: any) {
      res.status(500).json({
        error: "LOGOUT_FAILED",
        message: error.message,
      });
    }
  }

  /**
   * CSRF Token - GET /auth/csrf-token
   */
  getCsrfToken(req: Request, res: Response) {
    res.json({
      csrfToken: req.csrfToken(),
    });
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
