import prisma from "../../shared/database/prisma";
import { Produto } from "@prisma/client";

export class ProdutoRepository {
  async create(data: any): Promise<Produto> {
    const produtoData: any = {
      nome: data.nome,
      categoria: data.categoria,
      volume: data.volume,
      estoqueAtual: Number(data.estoque_atual ?? data.estoqueAtual ?? 0),
      estoqueMinimo: Number(data.estoque_minimo ?? data.estoqueMinimo ?? 5),
      precoCompra: Number(data.preco_compra ?? data.precoCompra ?? 0),
      precoVenda: Number(data.preco_venda ?? data.precoVenda ?? 0),
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
      categoria: data.categoria ?? produto.categoria,
      volume: data.volume ?? produto.volume,
      estoqueAtual: Number(
        data.estoque_atual ?? data.estoqueAtual ?? produto.estoqueAtual,
      ),
      estoqueMinimo: Number(
        data.estoque_minimo ?? data.estoqueMinimo ?? produto.estoqueMinimo,
      ),
      precoCompra: Number(
        data.preco_compra ?? data.precoCompra ?? produto.precoCompra,
      ),
      precoVenda: Number(
        data.preco_venda ?? data.precoVenda ?? produto.precoVenda,
      ),
      status: data.status ?? produto.status,
    };

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
