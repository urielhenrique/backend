import { Response } from "express";
import { MovimentacaoService } from "./movimentacao.service";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";

const service = new MovimentacaoService();

export class MovimentacaoController {
  async create(req: AuthRequest, res: Response) {
    try {
      console.log("📥 Recebendo movimentação:", {
        body: req.body,
        estabelecimentoId: req.user!.estabelecimentoId,
        usuario: req.user!.userId,
      });

      const result = await service.create(
        req.user!.estabelecimentoId,
        req.body,
      );

      console.log("✅ Movimentação criada:", result.id);

      res.status(201).json(result);
    } catch (error: any) {
      console.error("❌ Erro ao criar movimentação:", error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const produtoId = req.query.produtoId as string | undefined;

    const result = await service.findAll(
      req.user!.estabelecimentoId,
      cursor,
      limit,
      produtoId,
    );
    res.json(result);
  }
}
