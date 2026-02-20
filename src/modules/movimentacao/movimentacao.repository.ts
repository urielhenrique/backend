import prisma from "../../shared/database/prisma";

export class MovimentacaoRepository {
  async create(data: any) {
    return prisma.movimentacao.create({ data });
  }

  async findAll(
    estabelecimentoId: string,
    cursor?: string,
    limit: number = 20,
    produtoId?: string,
  ) {
    const movimentacoes = await prisma.movimentacao.findMany({
      where: {
        estabelecimentoId,
        ...(produtoId && { produtoId }),
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ data: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            categoria: true,
          },
        },
      },
    });

    const hasMore = movimentacoes.length > limit;
    const data = hasMore ? movimentacoes.slice(0, limit) : movimentacoes;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}
