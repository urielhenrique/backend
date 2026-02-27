import prisma from "../../shared/database/prisma";
import { Produto } from "@prisma/client";

/**
 * Helper: Normaliza categoria removendo acentos
 */
function normalizarCategoria(categoria: string): string {
  const map: { [key: string]: string } = {
    Água: "Agua",
    Energético: "Energetico",
  };
  return map[categoria] || categoria;
}

/**
 * Helper: Converte valor monetário de forma segura
 * - Aceita números, strings com ponto ou vírgula decimal
 * - Retorna 0 para valores inválidos ou vazios
 * - Valida valores negativos e limites máximos
 * - Máximo: R$ 999.999,99
 */
function parseMoneyValue(value: any): number {
  // Se undefined, null ou string vazia, retorna 0
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  // Se já é número válido
  if (typeof value === "number") {
    // Valida range: 0 até 999999.99
    if (value < 0) return 0;
    if (value > 999999.99) {
      throw new Error("Valor máximo permitido: R$ 999.999,99");
    }
    return value;
  }

  // Se é string, limpa e converte
  // Aceita vírgula ou ponto como separador decimal (mobile-friendly)
  const cleaned = String(value).replace(",", ".").trim();

  // Rejeita notação científica (ex: 1e+28)
  if (cleaned.toLowerCase().includes("e")) {
    throw new Error("Formato de número inválido");
  }

  const parsed = parseFloat(cleaned);

  // Valida resultado
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }

  if (parsed > 999999.99) {
    throw new Error("Valor máximo permitido: R$ 999.999,99");
  }

  return parsed;
}

/**
 * Helper: Converte número inteiro de forma segura
 * - Máximo: 999.999 unidades
 */
function parseIntValue(value: any, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const strValue = String(value);

  // Rejeita notação científica (ex: 1e+28)
  if (strValue.toLowerCase().includes("e")) {
    throw new Error("Formato de número inválido");
  }

  const parsed = parseInt(strValue);

  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (parsed < 0) {
    return 0;
  }

  if (parsed > 999999) {
    throw new Error("Valor máximo permitido: 999.999 unidades");
  }

  return parsed;
}

export class ProdutoRepository {
  async create(data: any): Promise<Produto> {
    const produtoData: any = {
      nome: data.nome,
      categoria: normalizarCategoria(data.categoria),
      volume: data.volume,
      estoqueAtual: parseIntValue(data.estoque_atual ?? data.estoqueAtual, 0),
      estoqueMinimo: parseIntValue(
        data.estoque_minimo ?? data.estoqueMinimo,
        5,
      ),
      precoCompra: parseMoneyValue(data.preco_compra ?? data.precoCompra),
      precoVenda: parseMoneyValue(data.preco_venda ?? data.precoVenda),
      estabelecimentoId: data.estabelecimento_id ?? data.estabelecimentoId,
      status: data.status ?? "OK",
    };

    const fornecedorId = data.fornecedor_id || data.fornecedorId;

    if (fornecedorId && fornecedorId.trim() !== "") {
      produtoData.fornecedorId = fornecedorId;
    }

    return prisma.produto.create({
      data: produtoData,
    });
  }
  async findAll(
    estabelecimentoId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const produtos = await prisma.produto.findMany({
      where: { estabelecimentoId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const hasMore = produtos.length > limit;
    const data = hasMore ? produtos.slice(0, limit) : produtos;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async findById(id: string, estabelecimentoId: string) {
    return prisma.produto.findFirst({
      where: {
        id,
        estabelecimentoId,
      },
    });
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    const produto = await prisma.produto.findFirst({
      where: {
        id,
        estabelecimentoId,
      },
    });

    if (!produto) {
      throw new Error("Produto não encontrado");
    }

    const updateData: any = {
      nome: data.nome ?? produto.nome,
      categoria: data.categoria
        ? normalizarCategoria(data.categoria)
        : produto.categoria,
      volume: data.volume ?? produto.volume,
      estoqueAtual: parseIntValue(
        data.estoque_atual ?? data.estoqueAtual,
        produto.estoqueAtual,
      ),
      estoqueMinimo: parseIntValue(
        data.estoque_minimo ?? data.estoqueMinimo,
        produto.estoqueMinimo,
      ),
      status: data.status ?? produto.status,
    };

    // Preços: se vier no payload, converte; senão mantém o anterior
    if (data.preco_compra !== undefined || data.precoCompra !== undefined) {
      updateData.precoCompra = parseMoneyValue(
        data.preco_compra ?? data.precoCompra,
      );
    }

    if (data.preco_venda !== undefined || data.precoVenda !== undefined) {
      updateData.precoVenda = parseMoneyValue(
        data.preco_venda ?? data.precoVenda,
      );
    }

    const fornecedorId = data.fornecedor_id ?? data.fornecedorId;

    if (fornecedorId !== undefined) {
      if (fornecedorId && fornecedorId.trim() !== "") {
        updateData.fornecedorId = fornecedorId;
      } else {
        updateData.fornecedorId = null;
      }
    }

    return prisma.produto.update({
      where: {
        id,
      },
      data: updateData,
    });
  }

  async delete(id: string, estabelecimentoId: string) {
    return prisma.produto.deleteMany({
      where: {
        id,
        estabelecimentoId,
      },
    });
  }
}
