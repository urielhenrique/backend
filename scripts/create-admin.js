#!/usr/bin/env node

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log("\n🔐 Criando usuário ADMIN para Bar Controle...\n");

    const nomeEstabelecimento = "Bar Stock Pro";
    const nome = "Administrador";
    const email = "admin@barstock.com.br";
    const senha = "Admin@123456";

    // Verificar se usuário já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      console.log("⚠️  Usuário admin já existe!\n");
      console.log("📧 Email: " + email);
      console.log("🔑 Senha: " + senha);
      console.log("\n");
      await prisma.$disconnect();
      return;
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar ou buscar estabelecimento
    let estabelecimento = await prisma.estabelecimento.findFirst({
      where: { nome: nomeEstabelecimento },
    });

    if (!estabelecimento) {
      estabelecimento = await prisma.estabelecimento.create({
        data: { nome: nomeEstabelecimento },
      });
    }

    // Criar usuário admin
    await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        role: "ADMIN",
        estabelecimentoId: estabelecimento.id,
      },
    });

    console.log("✅ Usuário ADMIN criado com sucesso!\n");
    console.log("📊 Dados de Login:");
    console.log("📧 Email: " + email);
    console.log("🔑 Senha: " + senha);
    console.log("🏢 Estabelecimento: " + nomeEstabelecimento + "\n");
    console.log("⚠️  IMPORTANTE: Mude a senha na primeira autenticação!\n");
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:");
    console.error("Mensagem:", error.message);
    if (error.meta?.target) {
      console.error("Campo duplicado:", error.meta.target[0]);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
