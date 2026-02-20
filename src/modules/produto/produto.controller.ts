import { Response } from "express";
import { ProdutoService } from "./produto.service";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";

const service = new ProdutoService();

export class ProdutoController {
  async create(req: AuthRequest, res: Response) {
    try {
      const produto = await service.create(
        req.user!.estabelecimentoId,
        req.body,
      );

      res.status(201).json(produto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await service.findAll(
      req.user!.estabelecimentoId,
      cursor,
      limit,
    );
    res.json(result);
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      if (!id) {
        throw new Error("ID inválido");
      }
      const produto = await service.update(
        id,
        req.user!.estabelecimentoId,
        req.body,
      );
      res.json(produto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    await service.delete(id, req.user!.estabelecimentoId);
    res.json({ message: "Deletado com sucesso" });
  }
}
