"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../shared/database/prisma"));
const email_service_1 = __importDefault(require("../../shared/services/email.service"));
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// Inicializa Stripe apenas se a chave estiver configurada
const stripe = STRIPE_SECRET_KEY
    ? new stripe_1.default(STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia",
    })
    : null;
class BillingService {
    /**
     * Verifica se o Stripe está configurado
     */
    ensureStripeConfigured() {
        if (!stripe) {
            throw new Error("STRIPE_SECRET_KEY não configurado. Configure as variáveis de ambiente do Stripe.");
        }
    }
    /**
     * Criar sessão de checkout do Stripe
     */
    async createCheckoutSession(estabelecimentoId, userEmail) {
        this.ensureStripeConfigured();
        if (!STRIPE_PRICE_ID) {
            throw new Error("STRIPE_PRICE_ID não configurado");
        }
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
        });
        if (!estabelecimento) {
            throw new Error("Estabelecimento não encontrado");
        }
        // Se já é PRO, não pode criar nova assinatura
        if (estabelecimento.plano === "PRO") {
            throw new Error("Você já possui o plano PRO");
        }
        let customerId = estabelecimento.stripeCustomerId;
        // Criar customer no Stripe se não existir
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    estabelecimentoId: estabelecimento.id,
                    estabelecimentoNome: estabelecimento.nome,
                },
            });
            customerId = customer.id;
            // Salvar customer ID no banco
            await prisma_1.default.estabelecimento.update({
                where: { id: estabelecimentoId },
                data: { stripeCustomerId: customerId },
            });
        }
        // Criar sessão de checkout
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            success_url: `${FRONTEND_URL}/upgrade-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/upgrade?canceled=true`,
            metadata: {
                estabelecimentoId: estabelecimento.id,
            },
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Processar webhook do Stripe
     */
    async handleWebhook(body, signature) {
        this.ensureStripeConfigured();
        if (!STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            throw new Error(`Webhook signature verification failed: ${err.message}`);
        }
        // Idempotencia: ignora eventos ja processados
        try {
            await prisma_1.default.stripeWebhookEvent.create({
                data: {
                    eventId: event.id,
                    type: event.type,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002") {
                return { received: true, duplicate: true };
            }
            throw error;
        }
        try {
            // Processar eventos
            switch (event.type) {
                case "checkout.session.completed":
                    await this.handleCheckoutCompleted(event.data.object);
                    break;
                case "customer.subscription.created":
                case "customer.subscription.updated":
                    await this.handleSubscriptionUpdate(event.data.object);
                    break;
                case "customer.subscription.deleted":
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case "invoice.payment_succeeded": {
                    const invoice = event.data.object;
                    console.log(`Pagamento bem-sucedido: ${invoice.id}`);
                    break;
                }
                case "invoice.payment_failed":
                    await this.handlePaymentFailed(event.data.object);
                    break;
                default:
                    console.log(`Evento não tratado: ${event.type}`);
            }
            await prisma_1.default.stripeWebhookEvent.update({
                where: { eventId: event.id },
                data: { processedAt: new Date() },
            });
            return { received: true };
        }
        catch (error) {
            await prisma_1.default.stripeWebhookEvent.delete({
                where: { eventId: event.id },
            });
            throw error;
        }
    }
    /**
     * Atualizar plano para PRO após checkout
     */
    async handleCheckoutCompleted(session) {
        const estabelecimentoId = session.metadata?.estabelecimentoId;
        if (!estabelecimentoId) {
            console.error("Estabelecimento ID não encontrado no metadata");
            return;
        }
        // Atualizar plano para PRO
        await prisma_1.default.estabelecimento.update({
            where: { id: estabelecimentoId },
            data: {
                plano: "PRO",
            },
        });
        console.log(`Estabelecimento ${estabelecimentoId} atualizado para PRO`);
    }
    /**
     * Criar/atualizar registro de subscription
     */
    async handleSubscriptionUpdate(subscription) {
        const customerId = subscription.customer;
        // Buscar estabelecimento pelo customer ID
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { stripeCustomerId: customerId },
            include: { usuarios: true },
        });
        if (!estabelecimento) {
            console.error(`Estabelecimento não encontrado para customer ${customerId}`);
            return;
        }
        // Criar ou atualizar subscription
        const subData = await prisma_1.default.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                estabelecimentoId: estabelecimento.id,
            },
            update: {
                status: subscription.status,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
        // Atualizar plano baseado no status
        if (subscription.status === "active" ||
            subscription.status === "trialing") {
            await prisma_1.default.estabelecimento.update({
                where: { id: estabelecimento.id },
                data: { plano: "PRO" },
            });
            // Enviar email de confirmação de upgrade
            if (estabelecimento.usuarios && estabelecimento.usuarios.length > 0) {
                const adminEmail = estabelecimento.usuarios[0].email;
                await email_service_1.default.sendUpgradeConfirmation(adminEmail, estabelecimento.nome);
            }
            console.log(`✅ Subscription ativada e email enviado para ${estabelecimento.nome}`);
        }
    }
    /**
     * Downgrade para FREE quando subscription cancelada
     */
    async handleSubscriptionDeleted(subscription) {
        const customerId = subscription.customer;
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { stripeCustomerId: customerId },
            include: { usuarios: true },
        });
        if (!estabelecimento) {
            return;
        }
        // Downgrade para FREE
        await prisma_1.default.estabelecimento.update({
            where: { id: estabelecimento.id },
            data: { plano: "FREE" },
        });
        // Atualizar status da subscription
        await prisma_1.default.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: "canceled" },
        });
        // Enviar email de notificação de downgrade
        if (estabelecimento.usuarios && estabelecimento.usuarios.length > 0) {
            const adminEmail = estabelecimento.usuarios[0].email;
            const motivo = subscription.cancellation_details?.reason
                ? `Motivo: ${subscription.cancellation_details.reason}`
                : "Assinatura encerrada";
            await email_service_1.default.sendDowngradeNotification(adminEmail, estabelecimento.nome, motivo);
        }
        console.log(`⚠️ Estabelecimento ${estabelecimento.id} downgrade para FREE e email enviado`);
    }
    /**
     * Lidar com falha no pagamento
     */
    async handlePaymentFailed(invoice) {
        console.error("Falha no pagamento:", invoice.id);
        // Pode implementar lógica para notificar o usuário
        // ou suspender a conta após múltiplas falhas
    }
    /**
     * Obter portal de gerenciamento de assinatura
     */
    async createPortalSession(estabelecimentoId) {
        this.ensureStripeConfigured();
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
        });
        if (!estabelecimento?.stripeCustomerId) {
            throw new Error("Nenhuma assinatura encontrada");
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: estabelecimento.stripeCustomerId,
            return_url: `${FRONTEND_URL}/dashboard`,
        });
        return { url: session.url };
    }
    /**
     * Obter informações da assinatura
     */
    async getSubscriptionInfo(estabelecimentoId) {
        const subscription = await prisma_1.default.subscription.findFirst({
            where: {
                estabelecimentoId,
                status: { in: ["active", "trialing"] },
            },
            orderBy: { createdAt: "desc" },
        });
        if (!subscription) {
            return null;
        }
        return {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        };
    }
    /**
     * Gerar e enviar relatório de uso mensal
     */
    async generateAndSendUsageReport(estabelecimentoId) {
        const estabelecimento = await prisma_1.default.estabelecimento.findUnique({
            where: { id: estabelecimentoId },
            include: { usuarios: true },
        });
        if (!estabelecimento) {
            throw new Error("Estabelecimento não encontrado");
        }
        // Contar produtos
        const produtos = await prisma_1.default.produto.count({
            where: { estabelecimentoId },
        });
        // Contar usuários
        const usuarios = await prisma_1.default.usuario.count({
            where: { estabelecimentoId },
        });
        // Contar movimentações do mês
        const agora = new Date();
        const inicioDomes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const fimDomes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
        const movimentacoes = await prisma_1.default.movimentacao.count({
            where: {
                estabelecimentoId,
                createdAt: { gte: inicioDomes, lte: fimDomes },
            },
        });
        // Enviar relatório por email
        if (estabelecimento.usuarios && estabelecimento.usuarios.length > 0) {
            const adminEmail = estabelecimento.usuarios[0].email;
            await email_service_1.default.sendUsageReport(adminEmail, estabelecimento.nome, {
                produtos,
                usuarios,
                movimentacoes,
                plano: estabelecimento.plano,
            });
        }
        return {
            produtos,
            usuarios,
            movimentacoes,
            plano: estabelecimento.plano,
        };
    }
}
exports.BillingService = BillingService;
