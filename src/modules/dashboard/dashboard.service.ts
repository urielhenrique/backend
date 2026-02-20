import prisma from "../../shared/database/prisma";

export class DashboardService {
  async getData(estabelecimentoId: string) {
    const totalProdutos = await prisma.produto.count({
      where: { estabelecimentoId },
    });

    const produtosRepor = await prisma.produto.count({
      where: {
        estabelecimentoId,
        status: "Repor",
      },
    });

    const produtos = await prisma.produto.findMany({
      where: { estabelecimentoId },
    });

    const valorTotalCompra = produtos.reduce((total: number, produto: any) => {
      return total + produto.estoqueAtual * (produto.precoCompra ?? 0);
    }, 0);

    const valorTotalVenda = produtos.reduce((total: number, produto: any) => {
      return total + produto.estoqueAtual * (produto.precoVenda ?? 0);
    }, 0);

    const margemEstimada = valorTotalVenda - valorTotalCompra;

    const vendas = await prisma.movimentacao.groupBy({
      by: ["produtoId"],
      where: {
        estabelecimentoId,
        tipo: "Saida",
      },
      _sum: {
        quantidade: true,
      },
      orderBy: {
        _sum: {
          quantidade: "desc",
        },
      },
      take: 1,
    });

    let produtoMaisVendido = null;

    if (vendas.length > 0) {
      const produto = await prisma.produto.findUnique({
        where: { id: vendas[0].produtoId },
      });

      produtoMaisVendido = {
        nome: produto?.nome,
        quantidadeVendida: vendas[0]._sum.quantidade,
      };
    }

    const totalMovimentacoes = await prisma.movimentacao.count({
      where: { estabelecimentoId },
    });

    return {
      totalProdutos,
      produtosRepor,
      valorTotalCompra,
      valorTotalVenda,
      margemEstimada,
      produtoMaisVendido,
      totalMovimentacoes,
    };
  }
}
