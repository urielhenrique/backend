"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const csurf_1 = __importDefault(require("csurf"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const estabelecimento_routes_1 = __importDefault(require("./modules/estabelecimento/estabelecimento.routes"));
const produto_routes_1 = __importDefault(require("./modules/produto/produto.routes"));
const movimentacao_routes_1 = __importDefault(require("./modules/movimentacao/movimentacao.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const fornecedor_routes_1 = __importDefault(require("./modules/fornecedor/fornecedor.routes"));
const plano_routes_1 = __importDefault(require("./modules/plano/plano.routes"));
const seed_routes_1 = __importDefault(require("./modules/seed/seed.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const billing_routes_1 = __importDefault(require("./modules/billing/billing.routes"));
const security_middleware_1 = require("./shared/middlewares/security.middleware");
const app = (0, express_1.default)();
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
app.use((0, helmet_1.default)({
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
}));
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origin (Postman, curl, healthcheck)
        if (!origin)
            return callback(null, true);
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
}));
/**
 * ==========================================
 * BODY PARSER
 * ==========================================
 * IMPORTANTE: Webhook do Stripe precisa de raw body
 */
app.use(express_1.default.json({
    limit: "10kb", // Limite de 10kb para prevenir payload attacks
    verify: (req, res, buf) => {
        // Salva raw body para webhook do Stripe
        if (req.originalUrl === "/billing/webhook") {
            req.rawBody = buf;
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
/**
 * ==========================================
 * COOKIE PARSER
 * ==========================================
 */
app.use((0, cookie_parser_1.default)());
/**
 * ==========================================
 * CSRF PROTECTION
 * ==========================================
 * Protege contra ataques CSRF usando cookies
 * Token é gerado via GET /auth/csrf-token
 */
const csrfProtection = (0, csurf_1.default)({
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
    if (req.method === "GET" ||
        req.method === "HEAD" ||
        req.method === "OPTIONS") {
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
app.use(security_middleware_1.securityHeaders);
app.use(security_middleware_1.preventParameterPollution);
app.use((req, res, next) => {
    const skipRateLimitPaths = [
        "/auth/csrf-token",
        "/auth/login",
        "/auth/google",
    ];
    if (skipRateLimitPaths.includes(req.path)) {
        return next();
    }
    return (0, security_middleware_1.apiLimiter)(req, res, next);
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
 * ROUTES
 * ==========================================
 */
app.use("/auth", auth_routes_1.default);
app.use("/estabelecimento", estabelecimento_routes_1.default);
app.use("/produtos", produto_routes_1.default);
app.use("/movimentacoes", movimentacao_routes_1.default);
app.use("/dashboard", dashboard_routes_1.default);
app.use("/fornecedores", fornecedor_routes_1.default);
app.use("/plano", plano_routes_1.default);
app.use("/seed", seed_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/billing", billing_routes_1.default);
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
app.use(security_middleware_1.errorHandler);
/**
 * ==========================================
 * START SERVER
 * ==========================================
 */
const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security: ${IS_PRODUCTION ? "Production Mode" : "Development Mode"}`);
});
