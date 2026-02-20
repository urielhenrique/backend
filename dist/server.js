"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const estabelecimento_routes_1 = __importDefault(require("./modules/estabelecimento/estabelecimento.routes"));
const produto_routes_1 = __importDefault(require("./modules/produto/produto.routes"));
const movimentacao_routes_1 = __importDefault(require("./modules/movimentacao/movimentacao.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const fornecedor_routes_1 = __importDefault(require("./modules/fornecedor/fornecedor.routes"));
const plano_routes_1 = __importDefault(require("./modules/plano/plano.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/estabelecimento", estabelecimento_routes_1.default);
app.use("/produtos", produto_routes_1.default);
app.use("/movimentacoes", movimentacao_routes_1.default);
app.use("/dashboard", dashboard_routes_1.default);
app.use("/fornecedores", fornecedor_routes_1.default);
app.use("/plano", plano_routes_1.default);
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
