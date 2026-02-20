"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoRepository = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class MovimentacaoRepository {
    async create(data) {
        return prisma_1.default.movimentacao.create({ data });
    }
    async findAll(estabelecimentoId, cursor, limit = 20, produtoId) {
        const movimentacoes = await prisma_1.default.movimentacao.findMany({
            where: {
                estabelecimentoId,
                ...(produtoId && { produtoId }),
            },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: [{ data: "desc" }, { createdAt: "desc" }, { id: "desc" }],
            include: {
                produto: {
                    select: {
                        id: true,
                        nome: true,
                        categoria: true,
                    },
                },
            },
        });
        const hasMore = movimentacoes.length > limit;
        const data = hasMore ? movimentacoes.slice(0, limit) : movimentacoes;
        const nextCursor = hasMore ? data[data.length - 1].id : null;
        return {
            data,
            nextCursor,
            hasMore,
        };
    }
}
exports.MovimentacaoRepository = MovimentacaoRepository;
