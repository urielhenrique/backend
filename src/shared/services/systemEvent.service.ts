import prisma from "../database/prisma";
import type { EventType } from "@prisma/client";

export interface SystemEventPayload {
  eventType: EventType;
  userId?: string;
  estabelecimentoId?: string;
  metadata?: Record<string, any>;
}

export class SystemEventService {
  /**
   * Log an internal event (NEVER log sensitive data)
   * Only logs non-sensitive metadata
   */
  async logEvent(payload: SystemEventPayload): Promise<void> {
    try {
      await prisma.systemEvent.create({
        data: {
          eventType: payload.eventType,
          userId: payload.userId,
          estabelecimentoId: payload.estabelecimentoId,
          metadata: this.sanitizeMetadata(payload.metadata || {}),
        },
      });
    } catch (error) {
      // Silently fail to avoid impacting business logic
      console.error("[SystemEvent] Failed to log event:", error);
    }
  }

  /**
   * Sanitize metadata to remove any sensitive information
   * CRITICAL: Never log passwords, tokens, stripe secrets, etc
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    // Whitelist allowed fields only
    const allowedFields = [
      "action",
      "reason",
      "planBefore",
      "planAfter",
      "limitExceeded",
      "currentValue",
      "limitValue",
      "errorCode",
      "errorMessage", // Safe error messages only
      "eventCount",
      "timeOfDay",
      "userAgent",
    ];

    for (const [key, value] of Object.entries(metadata)) {
      if (allowedFields.includes(key)) {
        // Never store sensitive data even in allowed fields
        if (typeof value === "string" && this.isSensitiveValue(key, value)) {
          continue; // Skip this field
        }
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if a value appears to contain sensitive information
   */
  private isSensitiveValue(key: string, value: string): boolean {
    const lowerValue = value.toLowerCase();
    const lowerKey = key.toLowerCase();

    // Check for common sensitive patterns
    const sensitivePatterns = [
      "secret",
      "token",
      "password",
      "jwt",
      "bearer",
      "authorization",
      "stripe",
      "credit",
      "card",
      "cvv",
      "ssn",
      "api_key",
    ];

    return (
      sensitivePatterns.some(
        (pattern) => lowerKey.includes(pattern) || lowerValue.includes(pattern),
      ) || value.length > 100 // Suspicious long strings
    );
  }

  /**
   * Get events paginated with filters
   * Admin only
   */
  async getEvents(filters: {
    eventType?: EventType;
    estabelecimentoId?: string;
    days?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    const days = filters.days || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.estabelecimentoId)
      where.estabelecimentoId = filters.estabelecimentoId;

    const [events, total] = await Promise.all([
      prisma.systemEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.systemEvent.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get event statistics
   */
  async getStats(filters: { days?: number }) {
    const days = filters.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Count by event type
    const byType = await prisma.systemEvent.groupBy({
      by: ["eventType"],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    // Count by day
    const byDay = await prisma.systemEvent.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        createdAt: true,
      },
    });

    // Group by day
    const eventsByDay: Record<string, number> = {};
    byDay.forEach((event) => {
      const day = event.createdAt.toISOString().split("T")[0];
      eventsByDay[day] = (eventsByDay[day] || 0) + 1;
    });

    return {
      byType,
      byDay: Object.entries(eventsByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }
}

export const systemEventService = new SystemEventService();
export default systemEventService;
