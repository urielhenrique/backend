import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import estabelecimentoRoutes from "./modules/estabelecimento/estabelecimento.routes";
import produtoRoutes from "./modules/produto/produto.routes";
import movimentacaoRoutes from "./modules/movimentacao/movimentacao.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import fornecedorRoutes from "./modules/fornecedor/fornecedor.routes";
import planoRoutes from "./modules/plano/plano.routes";
import seedRoutes from "./modules/seed/seed.routes";

const app = express();

/**
 * ==========================================
 * CORS CONFIGURATION
 * ==========================================
 * - Produção: barstock.coderonin.com.br
 * - Desenvolvimento: localhost
 * - Permite Postman / curl (sem origin)
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

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }),
);

app.use(express.json());

/**
 * ==========================================
 * LOG MIDDLEWARE (DEBUG)
 * ==========================================
 */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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

/**
 * ==========================================
 * 404 HANDLER
 * ==========================================
 */
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

/**
 * ==========================================
 * START SERVER
 * ==========================================
 */

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
