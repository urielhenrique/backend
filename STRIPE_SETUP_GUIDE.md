# 🔧 Guia Rápido: Configurar Stripe para Pagamentos

## ⚡ Configuração em 5 Minutos

### 1️⃣ Criar Conta no Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Crie uma conta (gratuito)
3. Ative o "Modo de Teste" (toggle no canto superior direito)

---

### 2️⃣ Obter Chaves da API

1. No dashboard, vá em: **Developers → API keys**
2. Copie a **Secret key** (começa com `sk_test_`)
3. Cole no seu arquivo `.env`:

```env
STRIPE_SECRET_KEY=sk_test_51A...sua_chave_aqui
```

---

### 3️⃣ Criar Produto e Preço

1. No dashboard, vá em: **Products → Add product**
2. Preencha:
   - **Name**: `Plano PRO - BarStock`
   - **Description**: `Plano PRO com recursos ilimitados`
   - **Pricing**: `Recurring` (mensal)
   - **Price**: `R$ 29,90` (ou 2990 centavos)
   - **Currency**: `BRL`
3. Clique em **Save product**
4. Copie o **Price ID** (começa com `price_`)
5. Cole no `.env`:

```env
STRIPE_PRICE_ID=price_1A...seu_price_id_aqui
```

---

### 4️⃣ Configurar Webhook (Opcional para desenvolvimento)

Para receber notificações de pagamento:

1. No dashboard: **Developers → Webhooks → Add endpoint**
2. **Endpoint URL**: `http://localhost:3001/billing/webhook` (local) ou `https://seu-dominio.com/billing/webhook` (produção)
3. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Clique em **Add endpoint**
5. Copie o **Signing secret** (começa com `whsec_`)
6. Cole no `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...seu_webhook_secret_aqui
```

---

### 5️⃣ Configurar URL do Frontend

No arquivo `.env` do backend, adicione:

```env
FRONTEND_URL=http://localhost:5173
```

---

## ✅ Arquivo `.env` Completo

Seu arquivo `.env` do backend deve ter:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/estoque
JWT_SECRET=minhasuperchavesegura
GOOGLE_CLIENT_ID=121871816349-...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51A...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1A...

# Frontend URL
FRONTEND_URL=http://localhost:5173

NODE_ENV=development
PORT=3001
```

---

## 🧪 Testar Pagamento

### Cartões de Teste do Stripe

Use estes números para testar:

| Cenário                | Número do Cartão      | Resultado          |
| ---------------------- | --------------------- | ------------------ |
| ✅ Sucesso             | `4242 4242 4242 4242` | Pagamento aprovado |
| ❌ Recusado            | `4000 0000 0000 0002` | Pagamento recusado |
| ⏳ Requer autenticação | `4000 0025 0000 3155` | 3D Secure          |

**Dados adicionais (qualquer valor funciona):**

- **Validade**: Qualquer data futura (ex: `12/34`)
- **CVC**: Qualquer 3 números (ex: `123`)
- **CEP**: Qualquer 5 números (ex: `12345`)

---

## 🚀 Reiniciar o Backend

Após configurar, reinicie o servidor:

```bash
cd backend
npm run dev
```

---

## 🎯 Testar o Fluxo Completo

1. Faça login no frontend
2. Clique em **"Fazer Upgrade"** ou **"Ver Planos"**
3. Clique em **"Fazer Upgrade Agora"** no plano PRO
4. Use o cartão de teste: `4242 4242 4242 4242`
5. Complete o pagamento
6. Você será redirecionado de volta ao frontend
7. Seu plano deve aparecer como **PRO** ✅

---

## 📚 Recursos

- [Dashboard do Stripe](https://dashboard.stripe.com)
- [Documentação de Teste](https://stripe.com/docs/testing)
- [Cartões de Teste](https://stripe.com/docs/testing#cards)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

---

## ⚠️ Produção

Quando for para produção:

1. **Ative sua conta Stripe** (verifique identidade, banco, etc)
2. **Mude para chaves de produção** (começam com `sk_live_`)
3. **Configure webhook de produção** com sua URL real
4. **Atualize o FRONTEND_URL** para seu domínio real
5. **Nunca comite chaves** no Git (use `.env` e `.gitignore`)

---

**Status**: ✅ Configuração completa - pronto para receber pagamentos!
