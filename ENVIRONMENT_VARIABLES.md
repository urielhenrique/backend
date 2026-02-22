# 🔐 ENVIRONMENT VARIABLES GUIDE

Complete guide for configuring your SaaS application in production (Coolify).

---

## 📦 BACKEND ENVIRONMENT VARIABLES

### Required for Production

#### Database

```env
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```

- **Description**: PostgreSQL connection string
- **How to get**:
  - Use Coolify's built-in PostgreSQL service
  - Or external provider (Supabase, Railway, etc.)
- **Security**: MUST use SSL in production (`sslmode=require`)
- **Example**: `postgresql://myuser:mypass@db.example.com:5432/barstock?sslmode=require`

#### JWT Authentication

```env
JWT_SECRET=your-super-secret-random-string-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

- **JWT_SECRET**: Cryptographic secret for signing tokens
  - **How to generate**: `openssl rand -base64 32` (Linux/Mac) or use online generator
  - **CRITICAL**: Must be at least 32 characters, random, and never shared
  - **Example**: `xK8vN2mQ9pL4sR6tY8wZ1bV3cX5dF7gH`
- **JWT_EXPIRES_IN**: Access token lifetime (default: 1 hour)
- **JWT_REFRESH_EXPIRES_IN**: Refresh token lifetime (default: 7 days)

#### Google OAuth

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

- **How to get**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create a new project or select existing
  3. Go to "APIs & Services" → "Credentials"
  4. Create "OAuth 2.0 Client ID"
  5. Application type: "Web application"
  6. Authorized redirect URIs: `https://your-frontend-domain.com`
  7. Copy Client ID and Client Secret
- **Frontend needs**: Only `GOOGLE_CLIENT_ID` (not the secret!)

#### Stripe Payment Processing

```env
STRIPE_SECRET_KEY=sk_live_51ABCdef123...
STRIPE_WEBHOOK_SECRET=whsec_ABC123def456...
STRIPE_PRICE_ID=price_1ABCdef123...
```

- **How to get**:

  **STRIPE_SECRET_KEY**:
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
  2. Developers → API keys
  3. Copy "Secret key" (starts with `sk_live_` for production)
  4. **NEVER** use test keys (`sk_test_`) in production

  **STRIPE_PRICE_ID**:
  1. Products → Create product for "PRO Plan"
  2. Set recurring price (e.g., R$ 49.90/month)
  3. Copy the Price ID (starts with `price_`)

  **STRIPE_WEBHOOK_SECRET**:
  1. Developers → Webhooks
  2. Add endpoint: `https://your-backend-domain.com/billing/webhook`
  3. Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
  4. Copy "Signing secret" (starts with `whsec_`)

#### System Configuration

```env
MY_ADMIN_EMAIL=admin@yourdomain.com
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=3000
```

- **MY_ADMIN_EMAIL**: Email of system administrator
  - User with this email gets special admin privileges
  - Can access `/admin/*` routes
- **FRONTEND_URL**: Full URL of your frontend application
  - Used for Stripe redirects after payment
  - Must match CORS allowed origins
- **NODE_ENV**: Set to `production` (enables security features)
- **PORT**: Backend server port (default: 3000)

### Example Backend .env (DO NOT COMMIT)

```env
# Database
DATABASE_URL=postgresql://barstock_user:SecurePass123@db.internal:5432/barstock?sslmode=require

# JWT
JWT_SECRET=xK8vN2mQ9pL4sR6tY8wZ1bV3cX5dF7gH9jK0lM2nP4qR6sT8uV0wX2yZ4aB6cD8eF
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx

# Stripe
STRIPE_SECRET_KEY=sk_live_51ABCdef123456789...
STRIPE_WEBHOOK_SECRET=whsec_ABC123def456789...
STRIPE_PRICE_ID=price_1ABCdef123456

# System
MY_ADMIN_EMAIL=admin@barstock.com
FRONTEND_URL=https://barstock.coderonin.com.br
NODE_ENV=production
PORT=3000
```

---

## 🎨 FRONTEND ENVIRONMENT VARIABLES

### Required for Production

```env
VITE_API_URL=https://your-backend-domain.com
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
```

#### VITE_API_URL

- **Description**: Backend API endpoint
- **Example**: `https://api.barstock.com` or `https://barstock-api.coderonin.com.br`
- **IMPORTANT**: NO trailing slash
- **Build-time variable**: Must be set during `npm run build`

#### VITE_GOOGLE_CLIENT_ID

- **Description**: Google OAuth Client ID (public, safe to expose)
- **Same value** as backend's `GOOGLE_CLIENT_ID`
- **Not secret**: Can be seen in browser

### Example Frontend .env (Safe to Commit)

```env
VITE_API_URL=https://api.barstock.com
VITE_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com
```

---

## 🚀 COOLIFY DEPLOYMENT STEPS

### Backend Service Setup

1. **Create New Resource** in Coolify
   - Type: Application
   - Git Source: Your backend repository
   - Branch: `main`

2. **Build Configuration**
   - Build Pack: Dockerfile
   - Dockerfile Location: `./Dockerfile`
   - Port: 3000

3. **Environment Variables** (in Coolify UI)
   - Click "Environment Variables"
   - Add each variable listed above
   - Mark `JWT_SECRET`, `STRIPE_SECRET_KEY`, etc. as "Build Secret"

4. **Health Check**
   - Path: `/health`
   - Port: 3000
   - Interval: 30s

5. **Domain**
   - Add custom domain or use Coolify subdomain
   - Enable HTTPS (Let's Encrypt automatic)

### Frontend Service Setup

1. **Create New Resource** in Coolify
   - Type: Application
   - Git Source: Your frontend repository
   - Branch: `main`

2. **Build Configuration**
   - Build Pack: Dockerfile
   - Dockerfile Location: `./Dockerfile`
   - Port: 80
   - **Build Args**:
     - `VITE_API_URL=https://your-backend-domain.com`

3. **Environment Variables**
   - `VITE_API_URL` (set as build arg)
   - `VITE_GOOGLE_CLIENT_ID`

4. **Domain**
   - Add custom domain
   - Enable HTTPS

---

## 🔒 SECURITY BEST PRACTICES

### DO ✅

- Generate strong JWT_SECRET (32+ random characters)
- Use different secrets for dev/staging/production
- Store secrets only in Coolify (never in git)
- Use `sk_live_` Stripe keys in production
- Enable database SSL
- Use HTTPS for all domains

### DON'T ❌

- Commit `.env` files to git
- Share secrets via Slack/email
- Use test Stripe keys in production
- Expose backend secrets to frontend
- Use weak passwords or simple strings as JWT_SECRET
- Hardcode any credentials in code

---

## 📝 CHECKLIST FOR PRODUCTION

Before deploying, verify:

### Backend

- [ ] `DATABASE_URL` configured with SSL
- [ ] `JWT_SECRET` is 32+ random characters
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] `STRIPE_WEBHOOK_SECRET` configured
- [ ] `STRIPE_PRICE_ID` points to actual product
- [ ] `MY_ADMIN_EMAIL` is your email
- [ ] `FRONTEND_URL` matches frontend domain
- [ ] `NODE_ENV=production`
- [ ] All secrets marked as "Build Secret" in Coolify

### Frontend

- [ ] `VITE_API_URL` points to backend domain
- [ ] `VITE_GOOGLE_CLIENT_ID` matches backend
- [ ] Build successful (`npm run build` works locally)
- [ ] HTTPS enabled

### Stripe

- [ ] Webhook endpoint created: `https://backend/billing/webhook`
- [ ] Webhook events selected (see list above)
- [ ] Webhook secret copied to backend env
- [ ] Test payment in live mode works

### Google OAuth

- [ ] Authorized redirect URIs includes frontend domain
- [ ] OAuth consent screen configured
- [ ] App published (not in testing mode)

---

## 🆘 TROUBLESHOOTING

### "Token inválido ou expirado"

- Check `JWT_SECRET` is same on all backend instances
- Verify token hasn't actually expired (check `JWT_EXPIRES_IN`)

### "Google OAuth não configurado"

- Ensure `GOOGLE_CLIENT_ID` is set in backend
- Check it starts with numbers (not "your-client-id")

### "Stripe webhook signature verification failed"

- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL is correct
- Ensure backend receives raw body (not parsed JSON)

### "CORS error"

- Verify `FRONTEND_URL` in backend matches actual frontend domain
- Check CORS `allowedOrigins` in `server.ts` includes your domain
- Ensure HTTPS is enabled on both services

### "Database connection failed"

- Check `DATABASE_URL` format is correct
- Verify database is running and accessible
- Confirm SSL mode if required by provider

---

## 📧 SUPPORT

If you have issues with environment configuration:

1. Check Coolify logs for specific error messages
2. Verify all URLs use HTTPS (not HTTP)
3. Test environment variables locally first
4. Ensure no trailing slashes in URLs

---

## 🔄 UPDATING ENVIRONMENT VARIABLES

To change a variable in production:

1. Go to Coolify → Your Service → Environment Variables
2. Edit the variable value
3. Save changes
4. **Restart the service** (variables load at startup)
5. Verify health check passes

**Note**: Changing `VITE_*` variables requires rebuilding frontend!

---

**Last Updated**: February 2026
**Version**: 1.0.0
