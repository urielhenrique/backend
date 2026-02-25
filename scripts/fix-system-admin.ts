import dotenv from "dotenv";

// IMPORTANTE: Carrega variáveis de ambiente ANTES de importar o Prisma
dotenv.config();
dotenv.config({ path: ".env.local" });

import prisma from "../src/shared/database/prisma";
import bcrypt from "bcrypt";

const MY_ADMIN_EMAIL = process.env.MY_ADMIN_EMAIL;

async function main() {
  if (!MY_ADMIN_EMAIL) {
    console.error("❌ MY_ADMIN_EMAIL não configurado em .env.local");
    process.exit(1);
  }

  console.log(`🔍 Procurando usuário com email: ${MY_ADMIN_EMAIL}`);

  // Buscar ou criar usuário admin
  let admin = await prisma.usuario.findUnique({
    where: { email: MY_ADMIN_EMAIL },
  });

  const senhaHash = await bcrypt.hash("Admin@123456", 12);

  if (!admin) {
    console.log("✨ Criando novo admin de sistema...");
    admin = await prisma.usuario.create({
      data: {
        email: MY_ADMIN_EMAIL,
        nome: "System Admin",
        senhaHash,
        role: "ADMIN",
        estabelecimentoId: null, // Admin de sistema não tem estabelecimento
      },
    });
    console.log("✅ Admin criado com sucesso!");
  } else {
    console.log("📝 Atualizando admin existente...");
    admin = await prisma.usuario.update({
      where: { email: MY_ADMIN_EMAIL },
      data: {
        role: "ADMIN",
        estabelecimentoId: null, // Remove estabelecimento se houver
        senhaHash,
      },
    });
    console.log("✅ Admin atualizado com sucesso!");
  }

  console.log("\n📊 Dados do admin:");
  console.log({
    id: admin.id,
    email: admin.email,
    nome: admin.nome,
    role: admin.role,
    estabelecimentoId: admin.estabelecimentoId,
  });

  console.log("\n🔐 Credenciais:");
  console.log(`Email: ${MY_ADMIN_EMAIL}`);
  console.log(`Senha: Admin@123456`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
