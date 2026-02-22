# 🔐 ENVIRONMENT VARIABLES - QUICK REFERENCE

Copy and paste these into Coolify with your actual values.

---

## 🖥️ BACKEND ENVIRONMENT VARIABLES

```env
# Database (Get from Coolify PostgreSQL service)
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# JWT (Generate with: openssl rand -base64 32)
JWT_SECRET=your-32-character-random-string-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Get from console.cloud.google.com)
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Stripe (Get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_51ABCdef123456789...
STRIPE_WEBHOOK_SECRET=whsec_ABC123def456789...
STRIPE_PRICE_ID=price_1ABCdef123456

# System Configuration
MY_ADMIN_EMAIL=your-email@domain.com
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=3000
```

---

## 🎨 FRONTEND ENVIRONMENT VARIABLES

```env
# API Endpoint (Your backend URL)
VITE_API_URL=https://your-backend-domain.com

# Google OAuth (Same Client ID as backend)
VITE_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

---

## 🔧 HOW TO GET EACH VALUE

### `DATABASE_URL`

- **Coolify**: Use built-in PostgreSQL service
- **External**: Supabase, Railway, or any PostgreSQL provider
- **Format**: `postgresql://user:password@host:5432/dbname?sslmode=require`
- **Required**: Yes, absolutely critical

### `JWT_SECRET`

- **Generate**: `openssl rand -base64 32` (Linux/Mac)
- **Or**: Use online random string generator
- **Length**: Minimum 32 characters
- **Example**: `xK8vN2mQ9pL4sR6tY8wZ1bV3cX5dF7gH`
- **Security**: Never share, never commit to Git

### `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

- **Where**: [Google Cloud Console](https://console.cloud.google.com)
- **Steps**:
  1. Create project (or select existing)
  2. APIs & Services → Credentials
  3. Create OAuth 2.0 Client ID
  4. Application type: Web application
  5. Authorized redirect URIs: `https://your-frontend.com`
  6. Copy both Client ID and Secret
- **Note**: Frontend only needs Client ID (not the secret!)

### `STRIPE_SECRET_KEY`

- **Where**: [Stripe Dashboard](https://dashboard.stripe.com)
- **Steps**:
  1. Developers → API keys
  2. Copy "Secret key" (starts with `sk_live_` for production)
- **WARNING**: Never use test keys (`sk_test_`) in production

### `STRIPE_PRICE_ID`

- **Where**: Stripe Dashboard → Products
- **Steps**:
  1. Create new product: "PRO Plan"
  2. Add recurring price: R$ 49.90/month
  3. Copy the Price ID (starts with `price_`)
- **Example**: `price_1ABCdef123456`

### `STRIPE_WEBHOOK_SECRET`

- **Where**: Stripe Dashboard → Developers → Webhooks
- **Steps**:
  1. Add endpoint: `https://your-backend.com/billing/webhook`
  2. Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
  3. Copy "Signing secret" (starts with `whsec_`)

### `MY_ADMIN_EMAIL`

- **What**: Your personal email address
- **Purpose**: User with this email gets system admin access
- **Example**: `admin@yourcompany.com`
- **Access**: Can view `/admin` dashboard

### `FRONTEND_URL`

- **What**: Full URL of your frontend application
- **Example**: `https://app.yourcompany.com`
- **Used for**: Stripe redirects after payment, CORS

### `VITE_API_URL`

- **What**: Full URL of your backend API
- **Example**: `https://api.yourcompany.com`
- **No trailing slash!**
- **Build-time variable**: Set in Coolify build args

---

## ⚙️ COOLIFY CONFIGURATION

### Backend Service

**General**

- Repository: Your backend repo
- Branch: `main`
- Build Pack: Dockerfile
- Port: 3000

**Environment Variables** (Add in Coolify UI)

- Mark sensitive values as "Build Secret" ✅
- JWT_SECRET: Build Secret ✅
- STRIPE_SECRET_KEY: Build Secret ✅
- GOOGLE_CLIENT_SECRET: Build Secret ✅
- All others: Regular environment variables

**Health Check**

- Path: `/health`
- Port: 3000
- Interval: 30s

### Frontend Service

**General**

- Repository: Your frontend repo
- Branch: `main`
- Build Pack: Dockerfile
- Port: 80

**Build Arguments**

- `VITE_API_URL`: `https://your-backend.com`

**Environment Variables**

- `VITE_GOOGLE_CLIENT_ID`: (not secret, can be public)

---

## ✅ VERIFICATION

After setting all variables, test:

```bash
# Backend health check
curl https://your-backend.com/health

# Should return:
# {"status":"ok","environment":"production"}

# Frontend loads
curl https://your-frontend.com

# Should return HTML (not 404 or 500)
```

---

## 🚨 SECURITY WARNINGS

### DO NOT ❌

- Commit `.env` files to Git
- Share JWT_SECRET in Slack/email
- Use Stripe test keys in production
- Hardcode any secrets in code
- Use simple strings like "secret123"

### ALWAYS ✅

- Use cryptographically random JWT_SECRET
- Enable SSL for database (sslmode=require)
- Mark secrets as "Build Secret" in Coolify
- Use HTTPS for all URLs
- Rotate secrets regularly (JWT_SECRET every 90 days)

---

## 📋 CHECKLIST

Before going live, verify:

### Backend

- [ ] `DATABASE_URL` configured with SSL
- [ ] `JWT_SECRET` is random (32+ chars)
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] `STRIPE_PRICE_ID` points to actual product
- [ ] `MY_ADMIN_EMAIL` is your email
- [ ] `FRONTEND_URL` is correct
- [ ] `NODE_ENV=production`

### Frontend

- [ ] `VITE_API_URL` points to backend
- [ ] `VITE_GOOGLE_CLIENT_ID` matches backend
- [ ] Build completes successfully
- [ ] HTTPS enabled

### Stripe

- [ ] Webhook endpoint created
- [ ] Webhook events selected
- [ ] Webhook secret copied
- [ ] Test payment works in live mode

### Google OAuth

- [ ] Redirect URIs include frontend domain
- [ ] OAuth consent screen published
- [ ] App not in testing mode

---

## 🆘 COMMON ERRORS

### "Token inválido ou expirado"

**Cause**: JWT_SECRET mismatch  
**Fix**: Ensure JWT_SECRET is identical on all backend instances

### "Google OAuth não configurado"

**Cause**: GOOGLE_CLIENT_ID not set  
**Fix**: Add GOOGLE_CLIENT_ID to backend environment variables

### "Webhook signature verification failed"

**Cause**: STRIPE*WEBHOOK_SECRET incorrect  
**Fix**: Copy exact secret from Stripe dashboard (starts with `whsec*`)

### "CORS error"

**Cause**: Frontend URL not in CORS whitelist  
**Fix**: Update `allowedOrigins` in backend `server.ts`

### "DATABASE_URL not set"

**Cause**: Database environment variable missing  
**Fix**: Add DATABASE_URL in Coolify → Backend → Environment Variables

---

## 📞 SUPPORT

If you're stuck:

1. Check Coolify logs for error messages
2. Verify all URLs use HTTPS (not HTTP)
3. Ensure no trailing slashes in URLs
4. Test environment variables locally first

---

**Remember**: Environment variables are loaded at startup. After changing them in Coolify, **restart the service**!

For build-time variables like `VITE_*`, you must **rebuild** the frontend!

---

**Last Updated**: February 2026
