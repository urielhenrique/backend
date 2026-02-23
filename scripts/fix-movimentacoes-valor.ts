import "dotenv/config"; // ✅ Carrega variáveis de ambiente ANTES de importar prisma
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cria instância do Prisma com o mesmo adapter usado no projeto
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Script para atualizar movimentações antigas que não têm valorTotal/valorUnitario
 * Calcula os valores baseados no preço do produto na época
 */
async function fixMovimentacoes() {
  console.log("🔍 Buscando movimentações sem valorTotal...");

  const movimentacoesSemValor = await prisma.movimentacao.findMany({
    where: {
      OR: [{ valorTotal: null }, { valorUnitario: null }],
    },
    include: {
      produto: true,
    },
  });

  console.log(
    `📊 Encontradas ${movimentacoesSemValor.length} movimentações sem valores`,
  );

  let updated = 0;

  for (const mov of movimentacoesSemValor) {
    try {
      const valorUnitario =
        mov.tipo === "Saida" ? mov.produto.precoVenda : mov.produto.precoCompra;

      const valorTotal = mov.quantidade * (valorUnitario ?? 0);

      await prisma.movimentacao.update({
        where: { id: mov.id },
        data: {
          valorUnitario,
          valorTotal,
        },
      });

      updated++;
      console.log(
        `✅ Movimentação ${mov.id}: ${mov.tipo} - ${mov.quantidade}x R$ ${valorUnitario?.toFixed(2)} = R$ ${valorTotal.toFixed(2)}`,
      );
    } catch (error) {
      console.error(`❌ Erro ao atualizar movimentação ${mov.id}:`, error);
    }
  }

  console.log(`\n✨ ${updated} movimentações atualizadas com sucesso!`);
}

fixMovimentacoes()
  .then(async () => {
    console.log("✅ Script finalizado");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Erro ao executar script:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
