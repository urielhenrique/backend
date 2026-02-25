"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoService = void 0;
const produto_repository_1 = require("./produto.repository");
const plano_service_1 = require("../../shared/services/plano.service");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
class ProdutoService {
    repository = new produto_repository_1.ProdutoRepository();
    planoService = new plano_service_1.PlanoService();
    calcularStatus(estoqueAtual, estoqueMinimo) {
        if (estoqueAtual <= estoqueMinimo)
            return "Repor";
        if (estoqueAtual <= estoqueMinimo + 5)
            return "Atencao";
        return "OK";
    }
    async create(estabelecimentoId, data) {
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
    async findAll(estabelecimentoId, cursor, limit) {
        return this.repository.findAll(estabelecimentoId, cursor, limit);
    }
    async findById(id, estabelecimentoId) {
        return this.repository.findById(id, estabelecimentoId);
    }
    async update(id, estabelecimentoId, data) {
        if (data.estoqueAtual !== undefined && data.estoqueMinimo !== undefined) {
            data.status = this.calcularStatus(data.estoqueAtual, data.estoqueMinimo);
        }
        return this.repository.update(id, estabelecimentoId, data);
    }
    async delete(id, estabelecimentoId) {
        return this.repository.delete(id, estabelecimentoId);
    }
    /**
     * Importa múltiplos produtos em lote
     * Valida limite do plano antes de importar
     * @param estabelecimentoId ID do estabelecimento
     * @param produtos Array de produtos para importar
     * @returns Resultado da importação com sucesso e erros
     */
    async importarLote(estabelecimentoId, produtos) {
        // Validar se array não está vazio
        if (!produtos || produtos.length === 0) {
            throw new Error("Nenhum produto para importar");
        }
        // Buscar estabelecimento para verificar plano
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
        });
        if (!estabelecimento) {
            throw new Error("Estabelecimento não encontrado");
        }
        // Contar produtos existentes
        const produtosExistentes = await prisma_1.default.produto.count({
            where: { estabelecimentoId },
        });
        // Se plano FREE, validar limite
        if (estabelecimento.plano === "FREE") {
            const totalPosImportacao = produtosExistentes + produtos.length;
            const limite = estabelecimento.limiteProdutos;
            if (totalPosImportacao > limite) {
                throw new Error(`Importação bloqueada: você possui ${produtosExistentes} produtos cadastrados. ` +
                    `A importação de ${produtos.length} produtos resultaria em ${totalPosImportacao} produtos, ` +
                    `excedendo o limite de ${limite} produtos do plano FREE. ` +
                    `Atualize para o plano PRO para importar produtos ilimitados.`);
            }
        }
        // Processar importação
        const sucessos = [];
        const erros = [];
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
            }
            catch (error) {
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
exports.ProdutoService = ProdutoService;
