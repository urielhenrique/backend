import { Router, Request, Response } from "express";
import {
  authMiddleware,
  AuthRequest,
  requireSystemAdmin,
} from "../../shared/middlewares/auth.middleware";
import systemEventService from "../../shared/services/systemEvent.service";
import type { EventType } from "@prisma/client";

const router = Router();

/**
 * GET /internal/monitoring
 * Admin only - Internal monitoring dashboard data
 * Returns paginated events and statistics
 */
router.get(
  "/",
  authMiddleware,
  requireSystemAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const days = parseInt(req.query.days as string) || 30;
      const eventType = req.query.eventType as EventType | undefined;
      const estabelecimentoId = req.query.estabelecimentoId as
        | string
        | undefined;

      // Get paginated events
      const events = await systemEventService.getEvents({
        page,
        limit,
        days,
        eventType,
        estabelecimentoId,
      });

      // Get statistics
      const stats = await systemEventService.getStats({ days });

      res.json({
        success: true,
        data: {
          events: events.events,
          pagination: events.pagination,
          stats,
        },
      });
    } catch (error: any) {
      console.error("[Monitoring] Error fetching events:", error);
      res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Erro ao buscar dados de monitoramento",
      });
    }
  },
);

export default router;
