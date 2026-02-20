"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoService = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const movimentacao_repository_1 = require("./movimentacao.repository");
const plano_service_1 = require("../../shared/services/plano.service");
class MovimentacaoService {
    repository = new movimentacao_repository_1.MovimentacaoRepository();
    planoService = new plano_service_1.PlanoService();
    calcularStatus(estoqueAtual, estoqueMinimo) {
        if (estoqueAtual <= estoqueMinimo)
            return "Repor";
        if (estoqueAtual <= estoqueMinimo + 5)
            return "Atencao";
        return "OK";
    }
    async create(estabelecimentoId, data) {
        // Valida limite de movimentações antes de criar
        await this.planoService.checkLimite(estabelecimentoId, "movimentacao");
        return prisma_1.default.$transaction(async (tx) => {
            const tipoNormalizado = data.tipo
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const quantidade = Number(data.quantidade);
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
            const novoStatus = this.calcularStatus(novoEstoque, produto.estoqueMinimo);
            // 🔥 NOVA LÓGICA FINANCEIRA
            const valorUnitario = tipoNormalizado === "Saida" ? produto.precoVenda : produto.precoCompra;
            const valorTotal = quantidade * (valorUnitario ?? 0);
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
                    tipo: data.tipo,
                    quantidade,
                    observacao: data.observacao,
                    valorUnitario,
                    valorTotal,
                },
            });
        });
    }
    async findAll(estabelecimentoId, cursor, limit, produtoId) {
        return this.repository.findAll(estabelecimentoId, cursor, limit, produtoId);
    }
}
exports.MovimentacaoService = MovimentacaoService;
