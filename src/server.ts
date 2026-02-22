import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

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
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * ==========================================
 * BODY PARSER
 * ==========================================
 * IMPORTANTE: Webhook do Stripe precisa de raw body
 */
app.use(
  express.json({
    limit: "10kb", // Limite de 10kb para prevenir payload attacks
    verify: (req: any, res, buf) => {
      // Salva raw body para webhook do Stripe
      if (req.originalUrl === "/billing/webhook") {
        req.rawBody = buf;
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/**
 * ==========================================
 * SECURITY MIDDLEWARES
 * ==========================================
 */
app.use(securityHeaders);
app.use(preventParameterPollution);
app.use(apiLimiter);

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
 * ERROR HANDLER
 * ==========================================
 */
app.use(errorHandler);

/**
 * ==========================================
 * START SERVER
 * ==========================================
 */
const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${NODE_ENV}`);
  console.log(
    `🔒 Security: ${IS_PRODUCTION ? "Production Mode" : "Development Mode"}`,
  );
});
