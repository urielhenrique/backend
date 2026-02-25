import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateAdminEmail() {
  try {
    const result = await prisma.usuario.updateMany({
      where: { email: "admin@barstock.com.br" },
      data: { email: "uriel.henrique.gomes.uh@gmail.com" },
    });

    console.log(`✅ ${result.count} usuário(s) atualizado(s)`);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail();
