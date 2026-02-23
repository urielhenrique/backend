"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentacaoController = void 0;
const movimentacao_service_1 = require("./movimentacao.service");
const service = new movimentacao_service_1.MovimentacaoService();
class MovimentacaoController {
    async create(req, res) {
        try {
            console.log("📥 Recebendo movimentação:", {
                body: req.body,
                estabelecimentoId: req.user.estabelecimentoId,
                usuario: req.user.userId,
            });
            const result = await service.create(req.user.estabelecimentoId, req.body);
            console.log("✅ Movimentação criada:", result.id);
            res.status(201).json(result);
        }
        catch (error) {
            console.error("❌ Erro ao criar movimentação:", error.message);
            res.status(400).json({ error: error.message });
        }
    }
    async findAll(req, res) {
        const cursor = req.query.cursor;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const produtoId = req.query.produtoId;
        const result = await service.findAll(req.user.estabelecimentoId, cursor, limit, produtoId);
        res.json(result);
    }
}
exports.MovimentacaoController = MovimentacaoController;
