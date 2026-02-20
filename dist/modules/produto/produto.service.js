"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoService = void 0;
const produto_repository_1 = require("./produto.repository");
const plano_service_1 = require("../../shared/services/plano.service");
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
    async update(id, estabelecimentoId, data) {
        if (data.estoqueAtual !== undefined && data.estoqueMinimo !== undefined) {
            data.status = this.calcularStatus(data.estoqueAtual, data.estoqueMinimo);
        }
        return this.repository.update(id, estabelecimentoId, data);
    }
    async delete(id, estabelecimentoId) {
        return this.repository.delete(id, estabelecimentoId);
    }
}
exports.ProdutoService = ProdutoService;
