import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("🔐 Criando usuário ADMIN...\n");

    const nomeEstabelecimento = "Bar Stock Pro";
    const nome = "Administrador";
    const email = "admin@barstock.com.br";
    const senha = "Admin@123456";

    // Criar estabelecimento
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

    console.log("✅ Usuário ADMIN criado com sucesso!\n");
    console.log("📊 Dados de Login:");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${senha}`);
    console.log(`🏢 Estabelecimento: ${nomeEstabelecimento}\n`);
    console.log("⚠️  IMPORTANTE: Mude a senha na primeira autenticação!\n");
  } catch (error: any) {
    console.error("❌ Erro ao criar usuário admin:", error.message);
    console.error("Detalhes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
