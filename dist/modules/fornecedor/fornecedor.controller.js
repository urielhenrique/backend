"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FornecedorController = void 0;
const fornecedor_service_1 = require("./fornecedor.service");
const service = new fornecedor_service_1.FornecedorService();
class FornecedorController {
    async findAll(req, res) {
        const cursor = req.query.cursor;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await service.findAll(req.user.estabelecimentoId, cursor, limit);
        res.json(result);
    }
    async create(req, res) {
        try {
            const fornecedor = await service.create(req.user.estabelecimentoId, req.body);
            res.status(201).json(fornecedor);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const id = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;
            if (!id) {
                throw new Error("ID inválido");
            }
            const fornecedor = await service.update(id, req.user.estabelecimentoId, req.body);
            res.json(fornecedor);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            const id = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;
            if (!id) {
                throw new Error("ID inválido");
            }
            await service.delete(id, req.user.estabelecimentoId);
            res.json({ message: "Deletado com sucesso" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.FornecedorController = FornecedorController;
