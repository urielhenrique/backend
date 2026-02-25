import { Request, Response } from "express";
import { BillingService } from "./billing.service";
import { AuthRequest } from "../../shared/middlewares/auth.middleware";

const billingService = new BillingService();

export class BillingController {
  /**
   * POST /billing/checkout
   * Criar sessão de checkout do Stripe
   */
  async createCheckout(req: AuthRequest, res: Response) {
    try {
      const { estabelecimentoId, userId } = req.user!;

      // Buscar email do usuário
      const user = await (
        await import("../../shared/database/prisma")
      ).default.usuario.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const session = await billingService.createCheckoutSession(
        estabelecimentoId,
        user.email,
      );

      res.json(session);
    } catch (error: any) {
      console.error("Erro ao criar checkout:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /billing/webhook
   * Receber webhooks do Stripe
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["stripe-signature"];

      if (!signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Signature ausente" });
      }

      // O body precisa estar em formato raw (Buffer)
      const result = await billingService.handleWebhook(
        req.body as Buffer,
        signature,
      );

      res.json(result);
    } catch (error: any) {
      console.error("Erro no webhook:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /billing/portal
   * Criar sessão do portal de gerenciamento
   */
  async createPortal(req: AuthRequest, res: Response) {
    try {
      const { estabelecimentoId } = req.user!;

      const portal =
        await billingService.createPortalSession(estabelecimentoId);

      res.json(portal);
    } catch (error: any) {
      console.error("Erro ao criar portal:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /billing/complete-checkout
   * Verificar e completar checkout após retorno do Stripe
   * (Útil para desenvolvimento local onde webhooks não funcionam)
   */
  async completeCheckout(req: AuthRequest, res: Response) {
    try {
      const { estabelecimentoId } = req.user!;
      // Frontend envia session_id (snake_case) por causa do interceptor
      const sessionId = req.body.sessionId || req.body.session_id;

      console.log("[Complete Checkout] Request body:", req.body);
      console.log("[Complete Checkout] Session ID:", sessionId);
      console.log("[Complete Checkout] Estabelecimento ID:", estabelecimentoId);

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID é obrigatório" });
      }

      const result = await billingService.completeCheckout(
        estabelecimentoId,
        sessionId,
      );

      console.log("[Complete Checkout] Resultado:", result);

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao completar checkout:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /billing/subscription
   * Obter informações da assinatura
   */
  async getSubscription(req: AuthRequest, res: Response) {
    try {
      const { estabelecimentoId } = req.user!;

      const subscription =
        await billingService.getSubscriptionInfo(estabelecimentoId);

      res.json(subscription || { status: "no_subscription" });
    } catch (error: any) {
      console.error("Erro ao buscar subscription:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /billing/report
   * Gerar e enviar relatório de uso mensal
   */
  async sendUsageReport(req: AuthRequest, res: Response) {
    try {
      const { estabelecimentoId } = req.user!;

      const report =
        await billingService.generateAndSendUsageReport(estabelecimentoId);

      res.json({
        success: true,
        message: "Relatório enviado por email com sucesso",
        data: report,
      });
    } catch (error: any) {
      console.error("Erro ao enviar relatório:", error);
      res.status(400).json({ error: error.message });
    }
  }
}
