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
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Google Auth - POST /auth/google
   */
  async googleLogin(req: Request, res: Response) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: "ID Token obrigatório" });
      }

      const result = await authService.googleAuth(idToken);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async me(req: AuthRequest, res: Response) {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user!.userId },
      include: { estabelecimento: true },
    });

    res.json({
      id: user?.id,
      name: user?.nome,
      email: user?.email,
      role: user?.role,
      estabelecimento_id: user?.estabelecimentoId,
      estabelecimento_nome: user?.estabelecimento.nome,
    });
  }
}
