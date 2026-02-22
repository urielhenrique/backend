# ⚡ QUICK START GUIDE - Production Deployment

## 🚀 TL;DR

This is now a production-ready SaaS with Stripe billing, Google OAuth, and plan limits.

---

## 📦 WHAT WAS ADDED

### Backend

- ✅ Stripe subscription billing
- ✅ Subscription database model
- ✅ Webhook handling with signature verification
- ✅ Helmet security headers
- ✅ Enhanced authentication (refresh tokens)
- ✅ System admin via MY_ADMIN_EMAIL
- ✅ Input validation & sanitization
- ✅ Production error handling

### Frontend

- ✅ Auth service (login, Google OAuth)
- ✅ Billing service (checkout, portal)
- ✅ Plan context (upgrade logic)
- ✅ Upgrade page (pricing)
- ✅ Plan limit modal
- ✅ Success page after payment

---

## 🔧 ENVIRONMENT VARIABLES (Coolify)

### Backend Service

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=<32+ random characters>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
STRIPE_SECRET_KEY=sk_live_<from Stripe Dashboard>
STRIPE_WEBHOOK_SECRET=whsec_<from Stripe Webhooks>
STRIPE_PRICE_ID=price_<PRO plan price ID>
MY_ADMIN_EMAIL=your@email.com
FRONTEND_URL=https://your-frontend.com
NODE_ENV=production
PORT=3000
```

### Frontend Service

```env
VITE_API_URL=https://your-backend.com
VITE_GOOGLE_CLIENT_ID=<same as backend>
```

---

## 🎯 SETUP CHECKLIST

### 1. Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth Client ID (Web application)
3. Add redirect URI: `https://your-frontend.com`
4. Copy Client ID and Secret

### 2. Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create PRO plan product (R$ 49.90/month recurring)
3. Copy Price ID
4. Create webhook: `https://your-backend.com/billing/webhook`
5. Select events: checkout, subscription, invoice
6. Copy webhook secret

### 3. Generate JWT Secret

```bash
openssl rand -base64 32
```

### 4. Deploy to Coolify

1. Create backend service (port 3000)
2. Create frontend service (port 80)
3. Add all environment variables
4. Deploy both services

### 5. Run Migration

```bash
# Coolify runs this automatically via Dockerfile
npx prisma db push
```

---

## 🧪 TEST YOUR DEPLOYMENT

### Basic Tests

```bash
# Health check
curl https://your-backend.com/health

# Response: {"status":"ok","environment":"production"}
```

### User Flow Test

1. ✅ Visit frontend → should redirect to login
2. ✅ Click "Login with Google" → should authenticate
3. ✅ Create products (up to 50 in FREE plan)
4. ✅ Try to create 51st product → should show upgrade modal
5. ✅ Click "Fazer Upgrade" → redirects to Stripe
6. ✅ Complete payment → redirects to success page
7. ✅ Create unlimited products (PRO plan)

### Admin Test

1. ✅ Login with MY_ADMIN_EMAIL
2. ✅ Visit `/admin` route (should show dashboard)
3. ✅ See metrics: users, subscriptions, revenue

---

## 📊 API ENDPOINTS

### Authentication

- `POST /auth/register` - Create account
- `POST /auth/login` - Email/password login
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Current user info

### Billing

- `POST /billing/checkout` - Create Stripe session
- `POST /billing/webhook` - Stripe webhook (internal)
- `GET /billing/portal` - Customer portal
- `GET /billing/subscription` - Subscription status

### Admin (requires MY_ADMIN_EMAIL)

- `GET /admin/dashboard` - System metrics
- `GET /admin/users` - List all users
- `GET /admin/users/plan/:plan` - Filter by plan
- `DELETE /admin/estabelecimento/:id` - Deactivate
- `POST /admin/estabelecimento/:id/activate` - Reactivate

---

## 🛡️ SECURITY FEATURES

### Implemented

- ✅ Helmet (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Rate limiting (5 login attempts / 15min)
- ✅ JWT expiration (1 hour access, 7 days refresh)
- ✅ bcrypt 12 rounds
- ✅ Input validation & sanitization
- ✅ Stripe webhook signature verification
- ✅ CORS whitelist
- ✅ 10kb body size limit
- ✅ XSS protection
- ✅ SQL injection prevention (Prisma)
- ✅ Production error sanitization

### ⚠️ TODO (High Priority)

- Migrate JWT from localStorage to httpOnly cookies
- Add CSRF protection
- Implement token blacklist on logout

---

## 💡 PLAN LIMITS

### FREE (R$ 0/month)

- 50 products
- 1 user
- 1000 movimentações/month

### PRO (R$ 49.90/month)

- Unlimited products
- Unlimited users
- Unlimited movimentações

---

## 🔍 TROUBLESHOOTING

### "Token inválido"

→ Check JWT_SECRET matches across all backend instances

### "Google OAuth não configurado"

→ Ensure GOOGLE_CLIENT_ID is set in backend env

### "Webhook signature failed"

→ Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard

### "CORS error"

→ Add your domain to `allowedOrigins` in server.ts

### "Database connection failed"

→ Check DATABASE_URL format and SSL mode

---

## 📚 FULL DOCUMENTATION

- **ENVIRONMENT_VARIABLES.md** - Complete setup guide
- **SECURITY.md** - Security architecture
- **IMPLEMENTATION_SUMMARY.md** - Full technical details

---

## 🎉 THAT'S IT!

Your SaaS is now production-ready with:

- Secure authentication
- Stripe billing
- Plan limits
- Admin dashboard
- Production-grade security

Deploy to Coolify and start accepting payments! 🚀

---

**Questions?** Check the full documentation files above.
