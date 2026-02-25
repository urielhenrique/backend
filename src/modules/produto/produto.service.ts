import { ProdutoRepository } from "./produto.repository";
import { PlanoService } from "../../shared/services/plano.service";
import prisma from "../../shared/database/prisma";

export class ProdutoService {
  private repository = new ProdutoRepository();
  private planoService = new PlanoService();

  private calcularStatus(estoqueAtual: number, estoqueMinimo: number) {
    if (estoqueAtual <= estoqueMinimo) return "Repor";
    if (estoqueAtual <= estoqueMinimo + 5) return "Atencao";
    return "OK";
  }

  async create(estabelecimentoId: string, data: any) {
    // Valida limite de produtos antes de criar
    await this.planoService.checkLimite(estabelecimentoId, "produto");

    const estoqueAtual = data.estoqueAtual ?? 0;
    const estoqueMinimo = data.estoqueMinimo ?? 5;

    const status = this.calcularStatus(estoqueAtual, estoqueMinimo);

    return this.repository.create({
      ...data,
      estabelecimentoId,
      status,
    });
  }

  async findAll(estabelecimentoId: string, cursor?: string, limit?: number) {
    return this.repository.findAll(estabelecimentoId, cursor, limit);
  }

  async findById(id: string, estabelecimentoId: string) {
    return this.repository.findById(id, estabelecimentoId);
  }

  async update(id: string, estabelecimentoId: string, data: any) {
    if (data.estoqueAtual !== undefined && data.estoqueMinimo !== undefined) {
      data.status = this.calcularStatus(data.estoqueAtual, data.estoqueMinimo);
    }

    return this.repository.update(id, estabelecimentoId, data);
  }

  async delete(id: string, estabelecimentoId: string) {
    return this.repository.delete(id, estabelecimentoId);
  }

  /**
   * Importa múltiplos produtos em lote
   * Valida limite do plano antes de importar
   * @param estabelecimentoId ID do estabelecimento
   * @param produtos Array de produtos para importar
   * @returns Resultado da importação com sucesso e erros
   */
  async importarLote(estabelecimentoId: string, produtos: any[]) {
    // Validar se array não está vazio
    if (!produtos || produtos.length === 0) {
      throw new Error("Nenhum produto para importar");
    }

    // Buscar estabelecimento para verificar plano
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    });

    if (!estabelecimento) {
      throw new Error("Estabelecimento não encontrado");
    }

    // Contar produtos existentes
    const produtosExistentes = await prisma.produto.count({
      where: { estabelecimentoId },
    });

    // Se plano FREE, validar limite
    if (estabelecimento.plano === "FREE") {
      const totalPosImportacao = produtosExistentes + produtos.length;
      const limite = estabelecimento.limiteProdutos;

      if (totalPosImportacao > limite) {
        throw new Error(
          `Importação bloqueada: você possui ${produtosExistentes} produtos cadastrados. ` +
            `A importação de ${produtos.length} produtos resultaria em ${totalPosImportacao} produtos, ` +
            `excedendo o limite de ${limite} produtos do plano FREE. ` +
            `Atualize para o plano PRO para importar produtos ilimitados.`,
        );
      }
    }

    // Processar importação
    const sucessos: any[] = [];
    const erros: any[] = [];

    for (let i = 0; i < produtos.length; i++) {
      const produto = produtos[i];

      try {
        // Validar campos obrigatórios
        if (!produto.nome || produto.nome.trim() === "") {
          throw new Error("Nome é obrigatório");
        }

        if (!produto.categoria || produto.categoria.trim() === "") {
          throw new Error("Categoria é obrigatória");
        }

        // Calcular status
        const estoqueAtual = produto.estoqueAtual ?? 0;
        const estoqueMinimo = produto.estoqueMinimo ?? 5;
        const status = this.calcularStatus(estoqueAtual, estoqueMinimo);

        // Criar produto
        const produtoCriado = await this.repository.create({
          ...produto,
          estabelecimentoId,
          status,
        });

        sucessos.push({
          linha: i + 1,
          produto: produtoCriado,
        });
      } catch (error: any) {
        erros.push({
          linha: i + 1,
          produto: produto.nome || "(sem nome)",
          erro: error.message,
        });
      }
    }

    return {
      total: produtos.length,
      sucessos: sucessos.length,
      erros: erros.length,
      detalhes: {
        sucessos,
        erros,
      },
    };
  }
}
