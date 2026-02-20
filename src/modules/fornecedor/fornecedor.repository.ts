import prisma from "../../shared/database/prisma";

export class FornecedorRepository {
  async findAll(
    estabelecimentoId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const fornecedores = await prisma.fornecedor.findMany({
      where: { estabelecimentoId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: {
            produtos: true,
          },
        },
      },
    });

    const hasMore = fornecedores.length > limit;
    const data = hasMore ? fornecedores.slice(0, limit) : fornecedores;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async create(estabelecimentoId: string, data: any) {
    return prisma.fornecedor.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        prazoEntregaDias: Number(
          data.prazo_entrega_dias ?? data.prazoEntregaDias ?? 2,
        ),
        estabelecimentoId,
      },
    });
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    return prisma.fornecedor.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, estabelecimentoId: string) {
    return prisma.fornecedor.deleteMany({
      where: {
        id,
        estabelecimentoId,
      },
    });
  }
}
