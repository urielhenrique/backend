"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanoService = void 0;
const prisma_1 = __importDefault(require("../database/prisma"));
class PlanoService {
    /**
     * Verifica se o estabelecimento atingiu os limites do seu plano.
     * Se o limite for excedido, lança um erro.
     * Se o plano for PRO, nenhuma validação é feita.
     *
     * @param estabelecimentoId - ID do estabelecimento
     * @param tipo - Tipo de limite a validar: "produto" | "usuario" | "movimentacao"
     * @throws Error se o limite foi atingido
     */
    async checkLimite(estabelecimentoId, tipo) {
        // Obtém o estabelecimento e seus limites (usando any para suportar novos campos)
        const estabelecimento = (await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
        }));
        if (!estabelecimento) {
            throw new Error("Estabelecimento não encontrado");
        }
        // Se é plano PRO, não há limites
        if (estabelecimento.plano === "PRO") {
            return;
        }
        // Validações para plano FREE
        if (tipo === "produto") {
            await this.validarLimiteProdutos(estabelecimentoId, estabelecimento.limiteProdutos);
        }
        if (tipo === "usuario") {
            await this.validarLimiteUsuarios(estabelecimentoId, estabelecimento.limiteUsuarios);
        }
        if (tipo === "movimentacao") {
            await this.validarLimiteMovimentacao(estabelecimentoId);
        }
    }
    /**
     * Valida o limite de produtos (padrão FREE: 50)
     */
    async validarLimiteProdutos(estabelecimentoId, limiteProdutos) {
        const count = await prisma_1.default.produto.count({
            where: { estabelecimentoId },
        });
        if (count >= limiteProdutos) {
            throw new Error(`Limite do plano FREE atingido (${limiteProdutos} produtos). Faça upgrade para PRO.`);
        }
    }
    /**
     * Valida o limite de usuários (padrão FREE: 1)
     */
    async validarLimiteUsuarios(estabelecimentoId, limiteUsuarios) {
        const count = await prisma_1.default.usuario.count({
            where: { estabelecimentoId },
        });
        if (count >= limiteUsuarios) {
            throw new Error(`Limite do plano FREE atingido (${limiteUsuarios} usuário). Faça upgrade para PRO.`);
        }
    }
    /**
     * Valida o limite de movimentações no mês atual (padrão FREE: 1000)
     * Conta movimentações criadas no mês atual
     */
    async validarLimiteMovimentacao(estabelecimentoId) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const count = await prisma_1.default.movimentacao.count({
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
            throw new Error(`Limite do plano FREE atingido (${LIMITE_MOVIMENTACAO_FREE} movimentações por mês). Faça upgrade para PRO.`);
        }
    }
    async getLimites(estabelecimentoId) {
        const estabelecimento = (await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
        }));
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
    async getUso(estabelecimentoId) {
        const [produtosCount, usuariosCount, movimentacaoMesCount] = await Promise.all([
            prisma_1.default.produto.count({
                where: { estabelecimentoId },
            }),
            prisma_1.default.usuario.count({
                where: { estabelecimentoId },
            }),
            prisma_1.default.movimentacao.count({
                where: {
                    estabelecimentoId,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
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
exports.PlanoService = PlanoService;
