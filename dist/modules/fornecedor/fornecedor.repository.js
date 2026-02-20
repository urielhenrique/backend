"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FornecedorRepository = void 0;
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class FornecedorRepository {
    async findAll(estabelecimentoId, cursor, limit = 20) {
        const fornecedores = await prisma_1.default.fornecedor.findMany({
            where: { estabelecimentoId },
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: [{ nome: "asc" }, { id: "asc" }],
            include: {
                _count: {
                    select: {
                        produtos: true,
                    },
                },
            },
        });
        const hasMore = fornecedores.length > limit;
        const data = hasMore ? fornecedores.slice(0, limit) : fornecedores;
        const nextCursor = hasMore ? data[data.length - 1].id : null;
        return {
            data,
            nextCursor,
            hasMore,
        };
    }
    async create(estabelecimentoId, data) {
        return prisma_1.default.fornecedor.create({
            data: {
                nome: data.nome,
                telefone: data.telefone,
                prazoEntregaDias: Number(data.prazo_entrega_dias ?? data.prazoEntregaDias ?? 2),
                estabelecimentoId,
            },
        });
    }
    async update(id, estabelecimentoId, data) {
        return prisma_1.default.fornecedor.update({
            where: { id },
            data,
        });
    }
    async delete(id, estabelecimentoId) {
        return prisma_1.default.fornecedor.deleteMany({
            where: {
                id,
                estabelecimentoId,
            },
        });
    }
}
exports.FornecedorRepository = FornecedorRepository;
