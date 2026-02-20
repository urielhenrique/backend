import prisma from "../../shared/database/prisma";
import { PlanoService } from "../../shared/services/plano.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class AuthService {
  private planoService = new PlanoService();

  async register(
    nomeEstabelecimento: string,
    nome: string,
    email: string,
    senha: string,
  ) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const estabelecimento = await prisma.estabelecimento.create({
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

    const user = estabelecimento.usuarios[0];

    const token = jwt.sign(
      {
        userId: user.id,
        estabelecimentoId: estabelecimento.id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return { token };
  }

  async login(email: string, senha: string) {
    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        estabelecimento: true,
      },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);

    if (!senhaValida) {
      throw new Error("Senha inválida");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        estabelecimentoId: user.estabelecimentoId,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role,
        estabelecimento_id: user.estabelecimentoId,
        estabelecimento_nome: user.estabelecimento.nome,
      },
    };
  }

  /**
   * Cria um novo usuário em um estabelecimento existente
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

    const senhaHash = await bcrypt.hash(senha, 10);

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
}
