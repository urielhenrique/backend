import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// Load .env and .env.local (local overrides global)
dotenv.config();
dotenv.config({ path: ".env.local" });
import helmet from "helmet";
import cookieParser from "cookie-parser";
import csrf from "csurf";

// Sentry monitoring
import {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  addSentryDataSanitization,
  captureException,
} from "./shared/services/sentry.service";

import authRoutes from "./modules/auth/auth.routes";
import estabelecimentoRoutes from "./modules/estabelecimento/estabelecimento.routes";
import produtoRoutes from "./modules/produto/produto.routes";
import movimentacaoRoutes from "./modules/movimentacao/movimentacao.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import fornecedorRoutes from "./modules/fornecedor/fornecedor.routes";
import planoRoutes from "./modules/plano/plano.routes";
import seedRoutes from "./modules/seed/seed.routes";
import adminRoutes from "./modules/admin/admin.routes";
import billingRoutes from "./modules/billing/billing.routes";
import monitoringRoutes from "./modules/monitoring/monitoring.routes";
import {
  securityHeaders,
  apiLimiter,
  errorHandler,
  preventParameterPollution,
} from "./shared/middlewares/security.middleware";

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

/**
 * ==========================================
 * SENTRY INITIALIZATION (must be first)
 * ==========================================
 */
initializeSentry(app);
addSentryDataSanitization();

/**
 * ==========================================
 * TRUST PROXY (para rate limiting correto atrás de load balancer)
 * ==========================================
 */
if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

/**
 * ==========================================
 * HELMET - Security Headers
 * ==========================================
 */
app.use(
  helmet({
    contentSecurityPolicy: IS_PRODUCTION
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        }
      : false,
    hsts: IS_PRODUCTION
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
);

/**
 * ==========================================
 * CORS CONFIGURATION
 * ==========================================
 */
const allowedOrigins = [
  "https://barstock.coderonin.com.br",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (Postman, curl, healthcheck)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (!IS_PRODUCTION) {
        // Em desenvolvimento, permite qualquer origin
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);

/**
 * ==========================================
 * SENTRY MIDDLEWARE (must be after CORS, before routes)
 * ==========================================
 */
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

/**
 * ==========================================
 * BODY PARSER
 * ==========================================
 * IMPORTANTE: Webhook do Stripe precisa de raw body
 */
app.use(
  express.json({
    limit: "10mb", // Limite aumentado para suportar importação em lote
    verify: (req: any, res, buf) => {
      // Salva raw body para webhook do Stripe
      if (req.originalUrl === "/billing/webhook") {
        req.rawBody = buf;
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * ==========================================
 * COOKIE PARSER
 * ==========================================
 */
app.use(cookieParser());

/**
 * ==========================================
 * CSRF PROTECTION
 * ==========================================
 * Protege contra ataques CSRF usando cookies
 * Token é gerado via GET /auth/csrf-token
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
  },
});

// Aplica CSRF middleware em TODAS as rotas (para injetar req.csrfToken)
// mas ignora validação para métodos seguros e rotas específicas
app.use((req, res, next) => {
  // Rotas que nunca precisam de CSRF (nem validação nem geração de token)
  const skipCsrfRoutes = ["/health", "/billing/webhook"];
  if (skipCsrfRoutes.includes(req.path)) {
    return next();
  }

  // Métodos seguros: apenas injeta req.csrfToken (não valida)
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS"
  ) {
    // Executa middleware mas ignora erro de validação
    return csrfProtection(req, res, (err) => {
      // Ignora erros em métodos seguros (apenas gera token)
      next();
    });
  }

  // POST/PUT/DELETE/PATCH: valida token obrigatório
  csrfProtection(req, res, next);
});

/**
 * ==========================================
 * SECURITY MIDDLEWARES
 * ==========================================
 */
app.use(securityHeaders);
app.use(preventParameterPollution);
app.use((req, res, next) => {
  const skipRateLimitPaths = [
    "/auth/csrf-token",
    "/auth/login",
    "/auth/google",
  ];

  if (skipRateLimitPaths.includes(req.path)) {
    return next();
  }

  return apiLimiter(req, res, next);
});

/**
 * ==========================================
 * LOG MIDDLEWARE (apenas em development)
 * ==========================================
 */
if (!IS_PRODUCTION) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * ==========================================
 * SENTRY TEST ENDPOINT (Development Only)
 * ==========================================
 */
app.get("/test-sentry-error", (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "Test endpoint not available in production",
    });
  }

  try {
    throw new Error("Test error from Sentry - /test-sentry-error endpoint");
  } catch (error: any) {
    console.error("[Sentry Test] Capturing test error:", error.message);
    captureException(error, {
      endpoint: "/test-sentry-error",
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

/**
 * ==========================================
 * ROUTES
 * ==========================================
 */
app.use("/auth", authRoutes);
app.use("/estabelecimento", estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);
app.use("/movimentacoes", movimentacaoRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/fornecedores", fornecedorRoutes);
app.use("/plano", planoRoutes);
app.use("/seed", seedRoutes);
app.use("/admin", adminRoutes);
app.use("/billing", billingRoutes);
app.use("/internal/monitoring", monitoringRoutes);

/**
 * ==========================================
 * 404 HANDLER
 * ==========================================
 */
app.use((req, res) => {
  if (!IS_PRODUCTION) {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
  }
  res.status(404).json({
    error: "ROUTE_NOT_FOUND",
    message: "Rota não encontrada",
    path: req.path,
  });
});

/**
 * ==========================================
 * ERROR HANDLER (with Sentry)
 * ==========================================
 * Note: errorHandler is called first (from security.middleware),
 * then sentryErrorHandler passes to error
 */
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // Capture error in Sentry
    captureException(err, {
      url: req.url,
      method: req.method,
      ip: req.ip,
    });

    // Call original error handler
    errorHandler(err, req, res, next);
  },
);

// Sentry error handler (final fallback)
app.use(sentryErrorHandler);

/**
 * ==========================================
 * START SERVER
 * ==========================================
 */
const PORT = parseInt(process.env.PORT || "3001", 10);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(
    `🔒 Security: ${IS_PRODUCTION ? "Production Mode" : "Development Mode"}`,
  );
});

/**
 * ==========================================
 * UNHANDLED EXCEPTION HANDLERS
 * ==========================================
 */
process.on(
  "unhandledRejection",
  (reason: Error | any, promise: Promise<any>) => {
    console.error("[Unhandled Rejection]", reason);
    captureException(reason, {
      type: "unhandledRejection",
      promise: promise.toString(),
    });
  },
);

process.on("uncaughtException", (error: Error) => {
  console.error("[Uncaught Exception]", error);
  captureException(error, {
    type: "uncaughtException",
  });
  // In production, gracefully shutdown after logging
  if (IS_PRODUCTION) {
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SIGTERM] Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
