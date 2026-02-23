"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoRepository = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
/**
 * Helper: Converte valor monetário de forma segura
 * - Aceita números, strings com ponto ou vírgula decimal
 * - Retorna null para valores inválidos ou vazios
 * - Valida valores negativos
 */
function parseMoneyValue(value) {
    // Se undefined, null ou string vazia, retorna null
    if (value === undefined || value === null || value === "") {
        return null;
    }
    // Se já é número válido
    if (typeof value === "number") {
        return value >= 0 ? value : null;
    }
    // Se é string, limpa e converte
    // Aceita vírgula ou ponto como separador decimal (mobile-friendly)
    const cleaned = String(value).replace(",", ".").trim();
    const parsed = parseFloat(cleaned);
    // Valida resultado
    if (isNaN(parsed) || parsed < 0) {
        return null;
    }
    return parsed;
}
/**
 * Helper: Converte número inteiro de forma segura
 */
function parseIntValue(value, defaultValue = 0) {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }
    const parsed = parseInt(String(value));
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
}
class ProdutoRepository {
    async create(data) {
        const produtoData = {
            nome: data.nome,
            categoria: data.categoria,
            volume: data.volume,
            estoqueAtual: parseIntValue(data.estoque_atual ?? data.estoqueAtual, 0),
            estoqueMinimo: parseIntValue(data.estoque_minimo ?? data.estoqueMinimo, 5),
            precoCompra: parseMoneyValue(data.preco_compra ?? data.precoCompra),
            precoVenda: parseMoneyValue(data.preco_venda ?? data.precoVenda),
            estabelecimentoId: data.estabelecimento_id ?? data.estabelecimentoId,
            status: data.status ?? "OK",
        };
        const fornecedorId = data.fornecedor_id || data.fornecedorId;
        if (fornecedorId && fornecedorId.trim() !== "") {
            produtoData.fornecedorId = fornecedorId;
        }
        return prisma_1.default.produto.create({
            data: produtoData,
        });
    }
    async findAll(estabelecimentoId, cursor, limit = 20) {
        const produtos = await prisma_1.default.produto.findMany({
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
    async findById(id, estabelecimentoId) {
        return prisma_1.default.produto.findFirst({
            where: {
                id,
                estabelecimentoId,
            },
        });
    }
    async update(id, estabelecimentoId, data) {
        const produto = await prisma_1.default.produto.findFirst({
            where: {
                id,
                estabelecimentoId,
            },
        });
        if (!produto) {
            throw new Error("Produto não encontrado");
        }
        const updateData = {
            nome: data.nome ?? produto.nome,
            categoria: data.categoria ?? produto.categoria,
            volume: data.volume ?? produto.volume,
            estoqueAtual: parseIntValue(data.estoque_atual ?? data.estoqueAtual, produto.estoqueAtual),
            estoqueMinimo: parseIntValue(data.estoque_minimo ?? data.estoqueMinimo, produto.estoqueMinimo),
            status: data.status ?? produto.status,
        };
        // Preços: se vier no payload, converte; senão mantém o anterior
        if (data.preco_compra !== undefined || data.precoCompra !== undefined) {
            updateData.precoCompra = parseMoneyValue(data.preco_compra ?? data.precoCompra);
        }
        if (data.preco_venda !== undefined || data.precoVenda !== undefined) {
            updateData.precoVenda = parseMoneyValue(data.preco_venda ?? data.precoVenda);
        }
        const fornecedorId = data.fornecedor_id ?? data.fornecedorId;
        if (fornecedorId !== undefined) {
            if (fornecedorId && fornecedorId.trim() !== "") {
                updateData.fornecedorId = fornecedorId;
            }
            else {
                updateData.fornecedorId = null;
            }
        }
        return prisma_1.default.produto.update({
            where: {
                id,
            },
            data: updateData,
        });
    }
    async delete(id, estabelecimentoId) {
        return prisma_1.default.produto.deleteMany({
            where: {
                id,
                estabelecimentoId,
            },
        });
    }
}
exports.ProdutoRepository = ProdutoRepository;
