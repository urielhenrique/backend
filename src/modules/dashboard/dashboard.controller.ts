import { Response } from "express";
import { DashboardService } from "./dashboard.service";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";

const service = new DashboardService();

export class DashboardController {
  async get(req: AuthRequest, res: Response) {
    const data = await service.getData(req.user!.estabelecimentoId);
    res.json(data);
  }
}
