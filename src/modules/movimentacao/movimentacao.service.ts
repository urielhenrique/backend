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

    // Normaliza nomes de campos (snake_case → camelCase)
    const produtoId = data.produto_id || data.produtoId;
    const tipo = data.tipo;
    const quantidade = data.quantidade;
    const observacao = data.observacao;

    // Valida campos obrigatórios
    if (!tipo) {
      throw new Error("Tipo de movimentação é obrigatório");
    }
    if (!produtoId) {
      throw new Error("Produto é obrigatório");
    }
    if (!quantidade) {
      throw new Error("Quantidade é obrigatória");
    }

    console.log("✅ Campos validados:", {
      produtoId,
      tipo,
      quantidade,
      observacao,
    });

    // Valida limite de movimentações antes de criar
    await this.planoService.checkLimite(estabelecimentoId, "movimentacao");

    return prisma.$transaction(async (tx: any) => {
      const tipoNormalizado = tipo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      console.log("📝 Tipo normalizado:", {
        original: tipo,
        normalizado: tipoNormalizado,
      });

      // Valida quantidade
      const qtd = parseInt(String(quantidade));
      if (isNaN(qtd) || qtd <= 0) {
        throw new Error("Quantidade inválida");
      }

      const produto = await tx.produto.findFirst({
        where: {
          id: produtoId,
          estabelecimentoId,
        },
      });

      if (!produto) {
        throw new Error("Produto não encontrado");
      }

      let novoEstoque = produto.estoqueAtual;

      if (tipoNormalizado === "Entrada") {
        novoEstoque += qtd;
      }

      if (tipoNormalizado === "Saida") {
        if (produto.estoqueAtual < qtd) {
          throw new Error("Estoque insuficiente");
        }
        novoEstoque -= qtd;
      }

      const novoStatus = this.calcularStatus(
        novoEstoque,
        produto.estoqueMinimo,
      );

      // � LÓGICA FINANCEIRA
      // Se o frontend enviou valorUnitario, usa ele
      // Senão, usa o preço do produto (venda para saída, compra para entrada)
      const valorUnitarioRecebido = data.valorUnitario || data.valor_unitario;
      const valorUnitario =
        valorUnitarioRecebido !== null && valorUnitarioRecebido !== undefined
          ? parseFloat(String(valorUnitarioRecebido))
          : tipoNormalizado === "Saida"
            ? produto.precoVenda
            : produto.precoCompra;

      const valorTotal = qtd * (valorUnitario ?? 0);

      console.log("💰 Movimentação:", {
        tipo: tipoNormalizado,
        quantidade,
        valorUnitario,
        valorTotal,
        produtoNome: produto.nome,
        valorRecebidoFrontend: valorUnitarioRecebido,
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
