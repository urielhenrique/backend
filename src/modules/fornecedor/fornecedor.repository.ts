import prisma from "../../shared/database/prisma";

/**
 * Helper: Valida prazo de entrega em dias
 * - Mínimo: 0 dias
 * - Máximo: 365 dias (1 ano)
 */
function validatePrazoEntregaDias(value: any): number {
  const defaultValue = 2;

  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const strValue = String(value);

  // Rejeita notação científica (ex: 1e+56)
  if (strValue.toLowerCase().includes("e")) {
    throw new Error("Formato de número inválido para prazo de entrega");
  }

  const parsed = parseInt(strValue);

  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 365) {
    throw new Error("Prazo de entrega máximo: 365 dias");
  }

  return parsed;
}

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
        telefone: data.telefone || null,
        cnpj: data.cnpj || null,
        email: data.email || null,
        prazoEntregaDias: validatePrazoEntregaDias(
          data.prazo_entrega_dias ?? data.prazoEntregaDias,
        ),
        estabelecimentoId,
      },
    });
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    // Filtra apenas campos válidos para atualização
    const updateData: any = {
      nome: data.nome,
      telefone: data.telefone || null,
      cnpj: data.cnpj || null,
      email: data.email || null,
      prazoEntregaDias: validatePrazoEntregaDias(
        data.prazo_entrega_dias ?? data.prazoEntregaDias,
      ),
    };

    return prisma.fornecedor.update({
      where: { id },
      data: updateData,
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
