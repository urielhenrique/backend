import { Router, Request, Response } from "express";
import {
  authMiddleware,
  AuthRequest,
  requireSystemAdmin,
} from "../../shared/middlewares/auth.middleware";
import systemEventService from "../../shared/services/systemEvent.service";
import { captureException } from "../../shared/services/sentry.service";
import type { EventType } from "@prisma/client";

const router = Router();
const NODE_ENV = process.env.NODE_ENV || "development";

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

/**
 * GET /internal/monitoring/test-error
 * Development only - Test error tracking with Sentry
 * Throws a controlled error to verify Sentry integration
 */
router.get("/test-error", (req: Request, res: Response) => {
  // Only allow in development
  if (NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "Test endpoint not available in production",
    });
  }

  try {
    // Simulate an error
    throw new Error("Test error from Sentry monitoring endpoint");
  } catch (error: any) {
    console.error("[Sentry Test] Capturing test error:", error.message);
    captureException(error, {
      endpoint: "/internal/monitoring/test-error",
      type: "development_test",
    });

    res.status(200).json({
      success: true,
      message: "Test error captured and sent to Sentry",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
