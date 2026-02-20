"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class DashboardService {
    async getData(estabelecimentoId) {
        const totalProdutos = await prisma_1.default.produto.count({
            where: { estabelecimentoId },
        });
        const produtosRepor = await prisma_1.default.produto.count({
            where: {
                estabelecimentoId,
                status: "Repor",
            },
        });
        const produtos = await prisma_1.default.produto.findMany({
            where: { estabelecimentoId },
        });
        const valorTotalCompra = produtos.reduce((total, produto) => {
            return total + produto.estoqueAtual * (produto.precoCompra ?? 0);
        }, 0);
        const valorTotalVenda = produtos.reduce((total, produto) => {
            return total + produto.estoqueAtual * (produto.precoVenda ?? 0);
        }, 0);
        const margemEstimada = valorTotalVenda - valorTotalCompra;
        const vendas = await prisma_1.default.movimentacao.groupBy({
            by: ["produtoId"],
            where: {
                estabelecimentoId,
                tipo: "Saida",
            },
            _sum: {
                quantidade: true,
            },
            orderBy: {
                _sum: {
                    quantidade: "desc",
                },
            },
            take: 1,
        });
        let produtoMaisVendido = null;
        if (vendas.length > 0) {
            const produto = await prisma_1.default.produto.findUnique({
                where: { id: vendas[0].produtoId },
            });
            produtoMaisVendido = {
                nome: produto?.nome,
                quantidadeVendida: vendas[0]._sum.quantidade,
            };
        }
        const totalMovimentacoes = await prisma_1.default.movimentacao.count({
            where: { estabelecimentoId },
        });
        return {
            totalProdutos,
            produtosRepor,
            valorTotalCompra,
            valorTotalVenda,
            margemEstimada,
            produtoMaisVendido,
            totalMovimentacoes,
        };
    }
}
exports.DashboardService = DashboardService;
