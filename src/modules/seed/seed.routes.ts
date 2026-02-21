import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const router = Router();
const prisma = new PrismaClient();

/**
 * Endpoint para criar usuario ADMIN
 * GET /seed/create-admin
 * APENAS PARA DESENVOLVIMENTO
 */
router.get("/create-admin", async (req, res) => {
  try {
    const nomeEstabelecimento = "Bar Stock Pro";
    const nome = "Administrador";
    const email = "admin@barstock.com.br";
    const senha = "Admin@123456";

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

    res.json({
      success: true,
      message: "✅ Usuário ADMIN criado com sucesso!",
      data: {
        email: email,
        senha: senha,
        estabelecimento: nomeEstabelecimento,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar admin:", error.message);
    res.status(400).json({
      success: false,
      message: "Erro ao criar admin",
      error: error.message,
    });
  }
});

export default router;
