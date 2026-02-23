import prisma from "../../shared/database/prisma";
import { MovimentacaoRepository } from "./movimentacao.repository";
import { PlanoService } from "../../shared/services/plano.service";

export class MovimentacaoService {
  private repository = new MovimentacaoRepository();
  private planoService = new PlanoService();

  private calcularStatus(estoqueAtual: number, estoqueMinimo: number) {
    if (estoqueAtual <= estoqueMinimo) return "Repor";
    if (estoqueAtual <= estoqueMinimo + 5) return "Atencao";
    return "OK";
  }

  async create(estabelecimentoId: string, data: any) {
    console.log("🔍 Movimentacao Service - Dados recebidos:", data);

    // Valida campos obrigatórios
    if (!data.tipo) {
      throw new Error("Tipo de movimentação é obrigatório");
    }
    if (!data.produtoId) {
      throw new Error("Produto é obrigatório");
    }
    if (!data.quantidade) {
      throw new Error("Quantidade é obrigatória");
    }

    // Valida limite de movimentações antes de criar
    await this.planoService.checkLimite(estabelecimentoId, "movimentacao");

    return prisma.$transaction(async (tx: any) => {
      const tipoNormalizado = data.tipo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      console.log("📝 Tipo normalizado:", {
        original: data.tipo,
        normalizado: tipoNormalizado,
      });

      // Valida quantidade
      const quantidade = parseInt(String(data.quantidade));
      if (isNaN(quantidade) || quantidade <= 0) {
        throw new Error("Quantidade inválida");
      }

      const produto = await tx.produto.findFirst({
        where: {
          id: data.produtoId,
          estabelecimentoId,
        },
      });

      if (!produto) {
        throw new Error("Produto não encontrado");
      }

      let novoEstoque = produto.estoqueAtual;

      if (tipoNormalizado === "Entrada") {
        novoEstoque += quantidade;
      }

      if (tipoNormalizado === "Saida") {
        if (produto.estoqueAtual < quantidade) {
          throw new Error("Estoque insuficiente");
        }
        novoEstoque -= quantidade;
      }

      const novoStatus = this.calcularStatus(
        novoEstoque,
        produto.estoqueMinimo,
      );

      // 🔥 NOVA LÓGICA FINANCEIRA
      const valorUnitario =
        tipoNormalizado === "Saida" ? produto.precoVenda : produto.precoCompra;

      const valorTotal = quantidade * (valorUnitario ?? 0);

      console.log("💰 Movimentação:", {
        tipo: tipoNormalizado,
        quantidade,
        valorUnitario,
        valorTotal,
        produtoNome: produto.nome,
      });

      await tx.produto.update({
        where: { id: produto.id },
        data: {
          estoqueAtual: novoEstoque,
          status: novoStatus,
        },
      });

      return tx.movimentacao.create({
        data: {
          produtoId: produto.id,
          estabelecimentoId,
          tipo: tipoNormalizado, // ✅ Usa tipo sem acento (enum do Prisma)
          quantidade,
          observacao: data.observacao,
          valorUnitario,
          valorTotal,
        },
      });
    });
  }

  async findAll(
    estabelecimentoId: string,
    cursor?: string,
    limit?: number,
    produtoId?: string,
  ) {
    return this.repository.findAll(estabelecimentoId, cursor, limit, produtoId);
  }
}
