"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billing_service_1 = require("./billing.service");
const billingService = new billing_service_1.BillingService();
class BillingController {
    /**
     * POST /billing/checkout
     * Criar sessão de checkout do Stripe
     */
    async createCheckout(req, res) {
        try {
            const { estabelecimentoId, userId } = req.user;
            // Buscar email do usuário
            const user = await (await Promise.resolve().then(() => __importStar(require("../../shared/database/prisma")))).default.usuario.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado" });
            }
            const session = await billingService.createCheckoutSession(estabelecimentoId, user.email);
            res.json(session);
        }
        catch (error) {
            console.error("Erro ao criar checkout:", error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * POST /billing/webhook
     * Receber webhooks do Stripe
     */
    async handleWebhook(req, res) {
        try {
            const signature = req.headers["stripe-signature"];
            if (!signature || typeof signature !== "string") {
                return res.status(400).json({ error: "Signature ausente" });
            }
            // O body precisa estar em formato raw (Buffer)
            const result = await billingService.handleWebhook(req.body, signature);
            res.json(result);
        }
        catch (error) {
            console.error("Erro no webhook:", error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * GET /billing/portal
     * Criar sessão do portal de gerenciamento
     */
    async createPortal(req, res) {
        try {
            const { estabelecimentoId } = req.user;
            const portal = await billingService.createPortalSession(estabelecimentoId);
            res.json(portal);
        }
        catch (error) {
            console.error("Erro ao criar portal:", error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * POST /billing/complete-checkout
     * Verificar e completar checkout após retorno do Stripe
     * (Útil para desenvolvimento local onde webhooks não funcionam)
     */
    async completeCheckout(req, res) {
        try {
            const { estabelecimentoId } = req.user;
            // Frontend envia session_id (snake_case) por causa do interceptor
            const sessionId = req.body.sessionId || req.body.session_id;
            console.log("[Complete Checkout] Request body:", req.body);
            console.log("[Complete Checkout] Session ID:", sessionId);
            console.log("[Complete Checkout] Estabelecimento ID:", estabelecimentoId);
            if (!sessionId) {
                return res.status(400).json({ error: "Session ID é obrigatório" });
            }
            const result = await billingService.completeCheckout(estabelecimentoId, sessionId);
            console.log("[Complete Checkout] Resultado:", result);
            res.json(result);
        }
        catch (error) {
            console.error("Erro ao completar checkout:", error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * GET /billing/subscription
     * Obter informações da assinatura
     */
    async getSubscription(req, res) {
        try {
            const { estabelecimentoId } = req.user;
            const subscription = await billingService.getSubscriptionInfo(estabelecimentoId);
            res.json(subscription || { status: "no_subscription" });
        }
        catch (error) {
            console.error("Erro ao buscar subscription:", error);
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * POST /billing/report
     * Gerar e enviar relatório de uso mensal
     */
    async sendUsageReport(req, res) {
        try {
            const { estabelecimentoId } = req.user;
            const report = await billingService.generateAndSendUsageReport(estabelecimentoId);
            res.json({
                success: true,
                message: "Relatório enviado por email com sucesso",
                data: report,
            });
        }
        catch (error) {
            console.error("Erro ao enviar relatório:", error);
            res.status(400).json({ error: error.message });
        }
    }
}
exports.BillingController = BillingController;
