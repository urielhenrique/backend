import { Router } from "express";
import { BillingController } from "./billing.controller";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import express from "express";

const router = Router();
const controller = new BillingController();

/**
 * POST /billing/checkout
 * Criar sessão de checkout (requer autenticação)
 */
router.post("/checkout", authMiddleware, (req, res) =>
  controller.createCheckout(req, res),
);

/**
 * POST /billing/complete-checkout
 * Completar checkout após retorno do Stripe
 * (Útil para desenvolvimento local onde webhooks não funcionam)
 */
router.post("/complete-checkout", authMiddleware, (req, res) =>
  controller.completeCheckout(req, res),
);

/**
 * POST /billing/webhook
 * Webhook do Stripe (não requer autenticação)
 * IMPORTANTE: Este endpoint precisa receber raw body
 */
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) =>
  controller.handleWebhook(req, res),
);

/**
 * GET /billing/portal
 * Portal de gerenciamento de assinatura
 */
router.get("/portal", authMiddleware, (req, res) =>
  controller.createPortal(req, res),
);

/**
 * GET /billing/subscription
 * Informações da assinatura atual
 */
router.get("/subscription", authMiddleware, (req, res) =>
  controller.getSubscription(req, res),
);

/**
 * POST /billing/report
 * Gerar e enviar relatório de uso mensal
 */
router.post("/report", authMiddleware, (req, res) =>
  controller.sendUsageReport(req, res),
);

export default router;
