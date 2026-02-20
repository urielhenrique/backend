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

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/estabelecimento", estabelecimentoRoutes);
app.use("/produtos", produtoRoutes);
app.use("/movimentacoes", movimentacaoRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/fornecedores", fornecedorRoutes);
app.use("/plano", planoRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
