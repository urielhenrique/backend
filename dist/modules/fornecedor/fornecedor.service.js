"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FornecedorService = void 0;
const fornecedor_repository_1 = require("./fornecedor.repository");
class FornecedorService {
    repo = new fornecedor_repository_1.FornecedorRepository();
    async findAll(estabelecimentoId, cursor, limit) {
        return this.repo.findAll(estabelecimentoId, cursor, limit);
    }
    async create(estabelecimentoId, data) {
        return this.repo.create(estabelecimentoId, data);
    }
    async update(id, estabelecimentoId, data) {
        return this.repo.update(id, estabelecimentoId, data);
    }
    async delete(id, estabelecimentoId) {
        return this.repo.delete(id, estabelecimentoId);
    }
}
exports.FornecedorService = FornecedorService;
