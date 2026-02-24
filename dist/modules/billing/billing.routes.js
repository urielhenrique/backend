"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = require("./billing.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const controller = new billing_controller_1.BillingController();
/**
 * POST /billing/checkout
 * Criar sessão de checkout (requer autenticação)
 */
router.post("/checkout", auth_middleware_1.authMiddleware, (req, res) => controller.createCheckout(req, res));
/**
 * POST /billing/webhook
 * Webhook do Stripe (não requer autenticação)
 * IMPORTANTE: Este endpoint precisa receber raw body
 */
router.post("/webhook", express_2.default.raw({ type: "application/json" }), (req, res) => controller.handleWebhook(req, res));
/**
 * GET /billing/portal
 * Portal de gerenciamento de assinatura
 */
router.get("/portal", auth_middleware_1.authMiddleware, (req, res) => controller.createPortal(req, res));
/**
 * GET /billing/subscription
 * Informações da assinatura atual
 */
router.get("/subscription", auth_middleware_1.authMiddleware, (req, res) => controller.getSubscription(req, res));
/**
 * POST /billing/report
 * Gerar e enviar relatório de uso mensal
 */
router.post("/report", auth_middleware_1.authMiddleware, (req, res) => controller.sendUsageReport(req, res));
exports.default = router;
