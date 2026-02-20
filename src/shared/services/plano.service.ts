import prisma from "../database/prisma";

export class PlanoService {
  /**
   * Verifica se o estabelecimento atingiu os limites do seu plano.
   * Se o limite for excedido, lança um erro.
   * Se o plano for PRO, nenhuma validação é feita.
   *
   * @param estabelecimentoId - ID do estabelecimento
   * @param tipo - Tipo de limite a validar: "produto" | "usuario" | "movimentacao"
   * @throws Error se o limite foi atingido
   */
  async checkLimite(
    estabelecimentoId: string,
    tipo: "produto" | "usuario" | "movimentacao",
  ): Promise<void> {
    // Obtém o estabelecimento e seus limites (usando any para suportar novos campos)
    const estabelecimento = (await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    })) as any;

    if (!estabelecimento) {
      throw new Error("Estabelecimento não encontrado");
    }

    // Se é plano PRO, não há limites
    if (estabelecimento.plano === "PRO") {
      return;
    }

    // Validações para plano FREE
    if (tipo === "produto") {
      await this.validarLimiteProdutos(
        estabelecimentoId,
        estabelecimento.limiteProdutos,
      );
    }

    if (tipo === "usuario") {
      await this.validarLimiteUsuarios(
        estabelecimentoId,
        estabelecimento.limiteUsuarios,
      );
    }

    if (tipo === "movimentacao") {
      await this.validarLimiteMovimentacao(estabelecimentoId);
    }
  }

  /**
   * Valida o limite de produtos (padrão FREE: 50)
   */
  private async validarLimiteProdutos(
    estabelecimentoId: string,
    limiteProdutos: number,
  ): Promise<void> {
    const count = await prisma.produto.count({
      where: { estabelecimentoId },
    });

    if (count >= limiteProdutos) {
      throw new Error(
        `Limite do plano FREE atingido (${limiteProdutos} produtos). Faça upgrade para PRO.`,
      );
    }
  }

  /**
   * Valida o limite de usuários (padrão FREE: 1)
   */
  private async validarLimiteUsuarios(
    estabelecimentoId: string,
    limiteUsuarios: number,
  ): Promise<void> {
    const count = await prisma.usuario.count({
      where: { estabelecimentoId },
    });

    if (count >= limiteUsuarios) {
      throw new Error(
        `Limite do plano FREE atingido (${limiteUsuarios} usuário). Faça upgrade para PRO.`,
      );
    }
  }

  /**
   * Valida o limite de movimentações no mês atual (padrão FREE: 1000)
   * Conta movimentações criadas no mês atual
   */
  private async validarLimiteMovimentacao(
    estabelecimentoId: string,
  ): Promise<void> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const count = await prisma.movimentacao.count({
      where: {
        estabelecimentoId,
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    const LIMITE_MOVIMENTACAO_FREE = 1000;

    if (count >= LIMITE_MOVIMENTACAO_FREE) {
      throw new Error(
        `Limite do plano FREE atingido (${LIMITE_MOVIMENTACAO_FREE} movimentações por mês). Faça upgrade para PRO.`,
      );
    }
  }

  async getLimites(estabelecimentoId: string) {
    const estabelecimento = (await prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
    })) as any;

    if (!estabelecimento) {
      throw new Error("Estabelecimento não encontrado");
    }

    const limites = {
      plano: estabelecimento.plano,
      limiteProdutos: estabelecimento.limiteProdutos,
      limiteUsuarios: estabelecimento.limiteUsuarios,
      limiteMovimentacaoMensal: 1000,
    };

    if (estabelecimento.plano === "PRO") {
      // PRO plans têm limites bem altos ou ilimitados
      return {
        ...limites,
        limiteProdutos: -1, // Ilimitado
        limiteUsuarios: -1, // Ilimitado
        limiteMovimentacaoMensal: -1, // Ilimitado
      };
    }

    return limites;
  }

  /**
   * Retorna o uso atual do estabelecimento
   */
  async getUso(estabelecimentoId: string) {
    const [produtosCount, usuariosCount, movimentacaoMesCount] =
      await Promise.all([
        prisma.produto.count({
          where: { estabelecimentoId },
        }),
        prisma.usuario.count({
          where: { estabelecimentoId },
        }),
        prisma.movimentacao.count({
          where: {
            estabelecimentoId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              lte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
              ),
            },
          },
        }),
      ]);

    return {
      produtos: produtosCount,
      usuarios: usuariosCount,
      movimentacaoMes: movimentacaoMesCount,
    };
  }
}
