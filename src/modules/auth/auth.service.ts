import prisma from "../../shared/database/prisma";
import { PlanoService } from "../../shared/services/plano.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const JWT_SECRET: string = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN: string =
  process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const MY_ADMIN_EMAIL = process.env.MY_ADMIN_EMAIL;

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

export class AuthService {
  private planoService = new PlanoService();

  /**
   * Determina role baseado no email
   * Se email for MY_ADMIN_EMAIL configura como ADMIN
   */
  private determineRole(email: string): "ADMIN" | "FUNCIONARIO" {
    if (MY_ADMIN_EMAIL && email === MY_ADMIN_EMAIL) {
      return "ADMIN";
    }
    return "ADMIN"; // Primeiro usuário do estabelecimento é ADMIN
  }

  /**
   * Gerar access token (1 hora)
   */
  private generateAccessToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Gerar refresh token (7 dias)
   */
  private generateRefreshToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  async register(
    nomeEstabelecimento: string,
    nome: string,
    email: string,
    senha: string,
  ) {
    // Validar campos obrigatórios
    if (!nomeEstabelecimento || !nome || !email || !senha) {
      throw new Error("Todos os campos são obrigatórios");
    }

    // Verificar se email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const senhaHash = await bcrypt.hash(senha, 12); // Usar bcrypt rounds 12 (mais seguro)
    const role = this.determineRole(email);

    const estabelecimento = await prisma.estabelecimento.create({
      data: {
        nome: nomeEstabelecimento,
        usuarios: {
          create: {
            nome,
            email,
            senhaHash,
            role,
          },
        },
      },
      include: { usuarios: true },
    });

    const user = estabelecimento.usuarios[0];

    const tokenPayload = {
      userId: user.id,
      estabelecimentoId: estabelecimento.id,
      role: user.role,
    };

    const token = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role,
        estabelecimento_id: estabelecimento.id,
        estabelecimento_nome: estabelecimento.nome,
        plano: estabelecimento.plano,
      },
    };
  }

  async login(email: string, senha: string) {
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        estabelecimento: true,
      },
    });

    if (!user) {
      // Não expor se usuário existe ou não (previne user enumeration)
      throw new Error("Credenciais inválidas");
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);

    if (!senhaValida) {
      throw new Error("Credenciais inválidas");
    }

    const tokenPayload = {
      userId: user.id,
      estabelecimentoId: user.estabelecimentoId,
      role: user.role,
    };

    const token = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role,
        estabelecimento_id: user.estabelecimentoId || null,
        estabelecimento_nome: user.estabelecimento?.nome || null,
        plano: user.estabelecimento?.plano || null,
      },
    };
  }

  /**
   * Criar um novo usuário em um estabelecimento existente
   * Valida o limite de usuários antes de criar
   */
  async createUsuario(
    estabelecimentoId: string,
    nome: string,
    email: string,
    senha: string,
    role: "ADMIN" | "FUNCIONARIO" = "FUNCIONARIO",
  ) {
    // Valida limite de usuários antes de criar
    await this.planoService.checkLimite(estabelecimentoId, "usuario");

    // Verificar se email já existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        role,
        estabelecimentoId,
      },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    };
  }

  /**
   * OAuth Google - Login/Registro
   */
  async googleAuth(googleToken: string) {
    if (!googleClient) {
      throw new Error("Google OAuth não configurado. Defina GOOGLE_CLIENT_ID");
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Payload inválido");

      const { email, name } = payload;

      if (!email) throw new Error("Email não fornecido pelo Google");

      // Verificar se usuário já existe
      let user = await prisma.usuario.findUnique({
        where: { email },
        include: { estabelecimento: true },
      });

      // Se não existe, criar novo usuário e estabelecimento
      if (!user) {
        const nomeEstabelecimento = name || email.split("@")[0];
        const senhaHash = await bcrypt.hash(Math.random().toString(), 12);
        const role = this.determineRole(email);

        const estabelecimento = await prisma.estabelecimento.create({
          data: {
            nome: nomeEstabelecimento,
            usuarios: {
              create: {
                nome: name || email,
                email,
                senhaHash,
                role,
              },
            },
          },
          include: { usuarios: true },
        });

        user = { ...estabelecimento.usuarios[0], estabelecimento };
      }

      const tokenPayload = {
        userId: user.id,
        estabelecimentoId: user.estabelecimentoId,
        role: user.role,
      };

      const token = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken(tokenPayload);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          estabelecimento_id: user.estabelecimentoId || null,
          estabelecimento_nome: user.estabelecimento?.nome || null,
          plano: user.estabelecimento?.plano || null,
        },
      };
    } catch (error: any) {
      throw new Error(`Falha na autenticação Google: ${error.message}`);
    }
  }
}
