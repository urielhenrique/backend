# Sentry Integration - Quick Reference

## Installation

```bash
# Backend
cd backend
npm install @sentry/node@^8.12.0 @sentry/profiling-node@^8.12.0

# Frontend
cd bar-controle-web
npm install @sentry/react@^8.12.0 @sentry/tracing@^8.12.0
```

## Quick Start

### 1. Get Sentry DSNs

1. Go to https://sentry.io/
2. Create backend project (Node.js)
3. Create frontend project (React)
4. Copy DSNs

### 2. Configure Environment Variables

**Backend (.env or .env.local)**

```
SENTRY_DSN=https://<key>@<domain>.ingest.sentry.io/<project_id>
NODE_ENV=production
```

**Frontend (.env or .env.local)**

```
VITE_SENTRY_DSN=https://<key>@<domain>.ingest.sentry.io/<project_id>
VITE_ENVIRONMENT=production
```

### 3. Test Locally (Development)

```bash
# Backend test
curl http://localhost:3001/internal/monitoring/test-error

# Should see test error in Sentry dashboard within 1-2 seconds
```

## File Structure

```
backend/
├── src/
│   ├── server.ts (modified - Added Sentry)
│   ├── shared/
│   │   ├── services/
│   │   │   └── sentry.service.ts (NEW)
│   │   └── middlewares/
│   │       └── security.middleware.ts (unchanged)
│   └── modules/
│       └── monitoring/
│           └── monitoring.routes.ts (modified - Added test endpoint)
└── package.json (modified - Added dependencies)

bar-controle-web/
├── src/
│   ├── main.jsx (modified - Added Sentry init)
│   ├── api/
│   │   └── api.ts (modified - Added error capture)
│   └── lib/
│       └── sentry.ts (NEW)
└── package.json (modified - Added dependencies)
```

## Key Features

### Backend

- ✅ Real-time error tracking
- ✅ Performance profiling (20% prod sampling)
- ✅ Unhandled rejection monitoring
- ✅ Graceful shutdown handling
- ✅ Automatic data sanitization

### Frontend

- ✅ Error boundary with fallback UI
- ✅ API error capture (5xx, 403, 402, connection)
- ✅ Browser performance monitoring
- ✅ User context tracking
- ✅ Automatic breadcrumb logging

### Both

- ✅ Sensitive data redaction (passwords, tokens, keys)
- ✅ No environment variable exposure
- ✅ No hardcoded secrets
- ✅ Development/Production sampling rates
- ✅ Stack trace capture

## Testing Endpoints

### Backend (Development Only)

```bash
# Test error capture
GET http://localhost:3001/internal/monitoring/test-error

# Returns:
{
  "success": true,
  "message": "Test error captured and sent to Sentry",
  "error": "Test error from Sentry monitoring endpoint",
  "timestamp": "2026-03-04T10:30:45.123Z"
}
```

### Frontend

- Any unhandled JavaScript error → Captured automatically
- Any API 5xx error → Captured automatically
- Click "Throw Error" button in debug mode → Captured by ErrorBoundary

## Important Notes

⚠️ **DO NOT EXPOSE**

- `SENTRY_DSN` to frontend (keep in backend .env only)
- Session tokens in error context
- Database credentials
- Stripe secret keys
- JWT tokens
- Passwords

✅ **SAFE TO EXPOSE**

- `VITE_SENTRY_DSN` (public DSN is intentional)
- User email and ID (non-sensitive)
- Error stack traces
- Request URLs
- HTTP status codes

## Monitoring Checklist

After deployment, verify:

- [ ] Test error endpoint works (dev only)
- [ ] Errors appear in Sentry dashboard
- [ ] Environment tags show correctly
- [ ] No sensitive data in events
- [ ] Profiling data visible
- [ ] Performance metrics tracked
- [ ] Health check still works
- [ ] Stripe webhook process normal
- [ ] Auth flow unchanged

## Troubleshooting

| Issue                    | Solution                                        |
| ------------------------ | ----------------------------------------------- |
| "Sentry not initialized" | Add `SENTRY_DSN` to .env                        |
| Errors not in Sentry     | Check DSN is correct, wait 1-2 seconds          |
| Build fails              | Run `npm install` again, check Node version     |
| Docker won't start       | Pass `SENTRY_DSN` as env var, not in Dockerfile |
| 403 on test endpoint     | Test endpoint only works in development         |

## Docker Deployment

```bash
# Build
docker build -t backend:latest .

# Run with Sentry
docker run -e SENTRY_DSN="your-dsn" \
           -e NODE_ENV="production" \
           backend:latest

# Or use docker-compose
# Add to environment section:
# SENTRY_DSN=your-dsn
# NODE_ENV=production
```

## Coolify Deployment

1. Go to Project Settings → Environment Variables
2. Add `SENTRY_DSN` (backend)
3. Add `VITE_SENTRY_DSN` (frontend build)
4. Add `VITE_ENVIRONMENT=production`
5. Rebuild and deploy

## Support

For issues or questions:

- Check [SENTRY_INTEGRATION.md](./SENTRY_INTEGRATION.md) for detailed docs
- Review Sentry dashboard for error patterns
- Check build logs for initialization messages
- Test with `NODE_ENV=development` first

## Performance Impact

- Backend: ~2-5% overhead (configurable sampling)
- Frontend: ~1-3% overhead (10% sampling in production)
- Network: ~1-2 events/second typical
- No blocking operations - all async

## Sampling Rates

| Environment | Backend | Frontend |
| ----------- | ------- | -------- |
| Production  | 20%     | 10%      |
| Development | 100%    | 100%     |
| Staging     | 50%     | 25%      |

These can be adjusted in `sentry.service.ts` and `sentry.ts`
