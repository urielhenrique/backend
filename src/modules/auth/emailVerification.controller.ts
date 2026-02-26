import { Request, Response } from "express";
import prisma from "../../shared/database/prisma";
import emailService from "../../shared/services/email.service";
import {
  generateToken,
  hashToken,
  isTokenValid,
  getExpirationDate,
} from "../../shared/utils/token.utils";
import bcrypt from "bcrypt";

export class EmailVerificationController {
  /**
   * POST /auth/send-verification-email
   * Reenviar email de verificação (após registro)
   * Sem autenticação obrigatória, mas com rate limit
   */
  async resendVerificationEmail(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "MISSING_EMAIL",
          message: "Email é obrigatório",
        });
      }

      // Buscar usuário
      const user = await prisma.usuario.findUnique({
        where: { email },
      });

      // Sempre retornar sucesso genérico (security: não revelar se email existe)
      if (!user) {
        return res.json({
          success: true,
          message:
            "Se o email existe em nossa base, um email de verificação foi enviado.",
        });
      }

      // Se já verificado, informar
      if (user.emailVerified) {
        return res.json({
          success: true,
          message: "Este email já foi verificado.",
        });
      }

      // Gerar novo token
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);
      const expiresAt = getExpirationDate(60); // 1 hora

      // Salvar no banco (hashed)
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expiresAt,
        },
      });

      // Enviar email com token raw
      await emailService.sendVerificationEmail(email, rawToken);

      res.json({
        success: true,
        message:
          "Se o email existe em nossa base, um email de verificação foi enviado.",
      });
    } catch (error: any) {
      console.error("[EmailVerification] Erro:", error.message);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao enviar email",
      });
    }
  }

  /**
   * GET /auth/verify-email?token=xxx
   * Verificar email usando token
   */
  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({
          error: "MISSING_TOKEN",
          message: "Token é obrigatório",
        });
      }

      // Hash o token recebido para comparar com o hash no banco
      const hashedToken = hashToken(token);

      // Buscar usuário com este token hasheado
      const user = await prisma.usuario.findFirst({
        where: {
          emailVerificationToken: hashedToken,
        },
      });

      // Token não existe
      if (!user) {
        return res.status(400).json({
          error: "INVALID_TOKEN",
          message: "Token inválido ou expirado",
        });
      }

      // Token expirou
      if (!isTokenValid(user.emailVerificationExpires)) {
        return res.status(400).json({
          error: "EXPIRED_TOKEN",
          message: "Token expirado. Solicite um novo.",
        });
      }

      // já verificado
      if (user.emailVerified) {
        return res.json({
          success: true,
          message: "Email já foi verificado anteriormente",
        });
      }

      // VÁLIDO: marcar email como verificado e limpar tokens
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });

      res.json({
        success: true,
        message: "Email verificado com sucesso! Você já pode fazer login.",
      });
    } catch (error: any) {
      console.error("[VerifyEmail] Erro:", error.message);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao verificar email",
      });
    }
  }

  /**
   * POST /auth/forgot-password
   * Solicitar reset de senha
   * Sempre retorna sucesso genérico (security)
   * Rate limit obrigatório no router
   */
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: "MISSING_EMAIL",
          message: "Email é obrigatório",
        });
      }

      // Buscar usuário - sem log
      const user = await prisma.usuario.findUnique({
        where: { email },
      });

      // Sempre retornar sucesso genérico
      if (!user) {
        return res.json({
          success: true,
          message:
            "Se o email existe em nossa base, você receberá um link para redefinir a senha.",
        });
      }

      // Gerar token de reset
      const rawToken = generateToken();
      const hashedToken = hashToken(rawToken);
      const expiresAt = getExpirationDate(15); // 15 minutos

      // Salvar no banco (hashed)
      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        },
      });

      // Enviar email com token raw
      await emailService.sendPasswordResetEmail(email, rawToken);

      // Sucesso genérico
      res.json({
        success: true,
        message:
          "Se o email existe em nossa base, você receberá um link para redefinir a senha.",
      });
    } catch (error: any) {
      console.error("[ForgotPassword] Erro:", error.message);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao processar solicitação",
      });
    }
  }

  /**
   * POST /auth/reset-password
   * Redefinir senha com token
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const password = req.body.password || req.body.senha;
      const passwordConfirm =
        req.body.passwordConfirm || req.body.confirmaSenha;

      // Validações
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          error: "MISSING_TOKEN",
          message: "Token é obrigatório",
        });
      }

      if (!password || !passwordConfirm) {
        return res.status(400).json({
          error: "MISSING_PASSWORD",
          message: "Senha e confirmação são obrigatórias",
        });
      }

      if (password !== passwordConfirm) {
        return res.status(400).json({
          error: "PASSWORD_MISMATCH",
          message: "Senhas não coincidem",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: "WEAK_PASSWORD",
          message: "Senha deve ter no mínimo 6 caracteres",
        });
      }

      // Hash o token recebido
      const hashedToken = hashToken(token);

      // Buscar usuário
      const user = await prisma.usuario.findFirst({
        where: {
          passwordResetToken: hashedToken,
        },
      });

      // Token inválido
      if (!user) {
        return res.status(400).json({
          error: "INVALID_TOKEN",
          message: "Link de reset inválido ou expirado",
        });
      }

      // Token expirou
      if (!isTokenValid(user.passwordResetExpires)) {
        return res.status(400).json({
          error: "EXPIRED_TOKEN",
          message: "Link de reset expirou. Solicite um novo.",
        });
      }

      // VÁLIDO: atualizar senha e limpar tokens
      const newPasswordHash = await bcrypt.hash(password, 12);

      await prisma.usuario.update({
        where: { id: user.id },
        data: {
          senhaHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      res.json({
        success: true,
        message: "Senha redefinida com sucesso. Faça login com sua nova senha.",
      });
    } catch (error: any) {
      console.error("[ResetPassword] Erro:", error.message);
      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "Erro ao redefinir senha",
      });
    }
  }
}

export default new EmailVerificationController();
