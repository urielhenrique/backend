import Stripe from "stripe";
import prisma from "../../shared/database/prisma";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurado");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export class BillingService {
  /**
   * Criar sessão de checkout do Stripe
   */
  async createCheckoutSession(estabelecimentoId: string, userEmail: string) {
    if (!STRIPE_PRICE_ID) {
      throw new Error("STRIPE_PRICE_ID não configurado");
    }

    const estabelecimento = await prisma.estabelecimento.findUnique({
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
      await prisma.estabelecimento.update({
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
  async handleWebhook(body: Buffer, signature: string) {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        console.log("Pagamento bem-sucedido:", event.data.object);
        break;

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Atualizar plano para PRO após checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const estabelecimentoId = session.metadata?.estabelecimentoId;

    if (!estabelecimentoId) {
      console.error("Estabelecimento ID não encontrado no metadata");
      return;
    }

    // Atualizar plano para PRO
    await prisma.estabelecimento.update({
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
  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Buscar estabelecimento pelo customer ID
    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!estabelecimento) {
      console.error(
        `Estabelecimento não encontrado para customer ${customerId}`,
      );
      return;
    }

    // Criar ou atualizar subscription
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        estabelecimentoId: estabelecimento.id,
      },
      update: {
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Atualizar plano baseado no status
    if (
      subscription.status === "active" ||
      subscription.status === "trialing"
    ) {
      await prisma.estabelecimento.update({
        where: { id: estabelecimento.id },
        data: { plano: "PRO" },
      });
    }
  }

  /**
   * Downgrade para FREE quando subscription cancelada
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const estabelecimento = await prisma.estabelecimento.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!estabelecimento) {
      return;
    }

    // Downgrade para FREE
    await prisma.estabelecimento.update({
      where: { id: estabelecimento.id },
      data: { plano: "FREE" },
    });

    // Atualizar status da subscription
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: "canceled" },
    });

    console.log(`Estabelecimento ${estabelecimento.id} downgrade para FREE`);
  }

  /**
   * Lidar com falha no pagamento
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.error("Falha no pagamento:", invoice.id);

    // Pode implementar lógica para notificar o usuário
    // ou suspender a conta após múltiplas falhas
  }

  /**
   * Obter portal de gerenciamento de assinatura
   */
  async createPortalSession(estabelecimentoId: string) {
    const estabelecimento = await prisma.estabelecimento.findUnique({
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
  async getSubscriptionInfo(estabelecimentoId: string) {
    const subscription = await prisma.subscription.findFirst({
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
}
