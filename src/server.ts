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

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Log middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route - must be before other routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/estabelecimento", estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);
app.use("/movimentacoes", movimentacaoRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/fornecedores", fornecedorRoutes);
app.use("/plano", planoRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
