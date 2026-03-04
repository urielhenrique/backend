import * as Sentry from "@sentry/node";
import { Request, Response, NextFunction } from "express";

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

/**
 * Initialize Sentry for monitoring and error tracking
 * Should be called BEFORE routes in server.ts
 */
export const initializeSentry = (app: any) => {
  const sentryDsn = process.env.SENTRY_DSN;

  // Skip Sentry initialization if DSN is not provided
  if (!sentryDsn) {
    console.warn(
      "[Sentry] SENTRY_DSN not provided. Error monitoring disabled.",
    );
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: NODE_ENV,
    // Set tracesSampleRate based on environment
    tracesSampleRate: IS_PRODUCTION ? 0.2 : 1.0,
    // Enable debug mode in development
    debug: !IS_PRODUCTION,
    // Capture performance metrics
    maxBreadcrumbs: IS_PRODUCTION ? 50 : 100,
    attachStacktrace: true,
  });

  // Set user context for better error tracking
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Extract user from JWT or session
    const userFromReq = (req as any).user;
    if (userFromReq && userFromReq.id) {
      Sentry.setUser({
        id: userFromReq.id,
        email: userFromReq.email,
        // Never set sensitive data like passwords
      });
    }
    next();
  });

  console.log("[Sentry] Initialized successfully");
};

/**
 * Sentry request handler middleware
 * Must be added BEFORE route handlers
 */
export const sentryRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Request tracking is handled by the HTTP integration
  next();
};

/**
 * Sentry tracing middleware
 * Must be added BEFORE route handlers
 */
export const sentryTracingHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Tracing is already handled by the HTTP integration
  next();
};

/**
 * Sentry error handler middleware
 * Must be added AFTER all route handlers
 */
export const sentryErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  captureException(err);
  next(err);
};

/**
 * Data sanitization middleware
 * Strips sensitive data before sending to Sentry
 */
export const sentryDataSanitization = () => {
  return (event: Sentry.Event, hint: Sentry.EventHint) => {
    // Remove sensitive headers
    if (event.request) {
      const sensitiveHeaders = [
        "authorization",
        "cookie",
        "x-csrf-token",
        "x-auth-token",
      ];

      sensitiveHeaders.forEach((header) => {
        if (event.request?.headers) {
          delete event.request.headers[header];
        }
      });

      // Remove sensitive query params
      if (event.request.url) {
        const url = new URL(event.request.url);
        const sensitiveParams = ["token", "password", "api_key", "secret"];
        sensitiveParams.forEach((param) => {
          url.searchParams.delete(param);
        });
        event.request.url = url.toString();
      }
    }

    // Remove sensitive data from request body
    if (event.request?.data) {
      const body = event.request.data as any;
      const sensitiveFields = [
        "password",
        "token",
        "jwt",
        "authorization",
        "stripe_token",
        "stripe_secret",
        "api_key",
        "secret_key",
        "credit_card",
        "card_number",
        "cvv",
        "ssn",
      ];

      sensitiveFields.forEach((field) => {
        if (body && field in body) {
          body[field] = "[REDACTED]";
        }
      });
    }

    // Remove breadcrumb data that contains sensitive info
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          const data = breadcrumb.data as any;
          const sensitiveFields = [
            "password",
            "token",
            "jwt",
            "authorization",
            "email",
            "stripe_token",
          ];

          sensitiveFields.forEach((field) => {
            if (field in data) {
              data[field] = "[REDACTED]";
            }
          });
        }
        return breadcrumb;
      });
    }

    return event;
  };
};

/**
 * Add Sentry data sanitization hook
 */
export const addSentryDataSanitization = () => {
  Sentry.addEventProcessor(sentryDataSanitization());
};

/**
 * Capture exception with context
 */
export const captureException = (error: any, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext("error_context", context);
  }
  Sentry.captureException(error);
};

/**
 * Capture message
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Add breadcrumb for tracking
 */
export const addBreadcrumb = (
  message: string,
  category: string = "custom",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, any>,
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};
