import { Response } from "express";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";
import { PlanoService } from "../../shared/services/plano.service";

const planoService = new PlanoService();

export class PlanoController {
  /**
   * GET /plano/limites
   * Retorna os limites do plano do estabelecimento
   */
  async getLimites(req: AuthRequest, res: Response) {
    try {
      const estabelecimentoId = req.user!.estabelecimentoId;
      const limites = await planoService.getLimites(estabelecimentoId);
      res.json(limites);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /plano/uso
   * Retorna o uso atual de recursos do estabelecimento
   */
  async getUso(req: AuthRequest, res: Response) {
    try {
      const estabelecimentoId = req.user!.estabelecimentoId;
      const uso = await planoService.getUso(estabelecimentoId);
      res.json(uso);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /plano/status
   * Retorna um resumo completo: limites + uso + percentuais
   */
  async getStatus(req: AuthRequest, res: Response) {
    try {
      const estabelecimentoId = req.user!.estabelecimentoId;

      const [limites, uso] = await Promise.all([
        planoService.getLimites(estabelecimentoId),
        planoService.getUso(estabelecimentoId),
      ]);

      // Calcula percentuais
      const percentualProdutos =
        limites.limiteProdutos > 0
          ? Math.round((uso.produtos / limites.limiteProdutos) * 100)
          : 0;

      const percentualUsuarios =
        limites.limiteUsuarios > 0
          ? Math.round((uso.usuarios / limites.limiteUsuarios) * 100)
          : 0;

      const percentualMovimentacao =
        limites.limiteMovimentacaoMensal > 0
          ? Math.round(
              (uso.movimentacaoMes / limites.limiteMovimentacaoMensal) * 100,
            )
          : 0;

      // Determina status (alerta se > 80%)
      const status = {
        plano: limites.plano,
        recursosProdutos: {
          usado: uso.produtos,
          limite: limites.limiteProdutos,
          percentual: percentualProdutos,
          atencao: percentualProdutos >= 80,
          atingido: percentualProdutos >= 100,
        },
        recursosUsuarios: {
          usado: uso.usuarios,
          limite: limites.limiteUsuarios,
          percentual: percentualUsuarios,
          atencao: percentualUsuarios >= 80,
          atingido: percentualUsuarios >= 100,
        },
        recursosMovimentacao: {
          usado: uso.movimentacaoMes,
          limite: limites.limiteMovimentacaoMensal,
          percentual: percentualMovimentacao,
          atencao: percentualMovimentacao >= 80,
          atingido: percentualMovimentacao >= 100,
        },
        limiteAting: [
          // Array com quais limites foram atingidos
          percentualProdutos >= 100 && "produtos",
          percentualUsuarios >= 100 && "usuarios",
          percentualMovimentacao >= 100 && "movimentacao",
        ].filter(Boolean),
        recomendacao:
          percentualProdutos >= 80 ||
          percentualUsuarios >= 80 ||
          percentualMovimentacao >= 80
            ? "Você está próximo de atingir os limites do plano FREE. Considere fazer upgrade para PRO."
            : null,
      };

      res.json(status);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
