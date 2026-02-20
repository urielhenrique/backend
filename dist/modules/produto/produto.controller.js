"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoController = void 0;
const produto_service_1 = require("./produto.service");
const service = new produto_service_1.ProdutoService();
class ProdutoController {
    async create(req, res) {
        try {
            const produto = await service.create(req.user.estabelecimentoId, req.body);
            res.status(201).json(produto);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async findAll(req, res) {
        const cursor = req.query.cursor;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await service.findAll(req.user.estabelecimentoId, cursor, limit);
        res.json(result);
    }
    async update(req, res) {
        try {
            const id = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;
            if (!id) {
                throw new Error("ID inválido");
            }
            const produto = await service.update(id, req.user.estabelecimentoId, req.body);
            res.json(produto);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            res.status(400).json({ error: "ID inválido" });
            return;
        }
        await service.delete(id, req.user.estabelecimentoId);
        res.json({ message: "Deletado com sucesso" });
    }
}
exports.ProdutoController = ProdutoController;
