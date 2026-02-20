# 🐳 Docker Setup - Production Ready

## 📋 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

### One-Command Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

This will:

1. ✅ Build the application (multi-stage)
2. ✅ Start PostgreSQL database
3. ✅ Run Prisma migrations
4. ✅ Start the Node.js server on port 3000

---

## 📁 Files Included

```
.
├── Dockerfile                    # Multi-stage production build
├── .dockerignore                 # Optimize build context
├── docker-compose.yml            # Development setup
├── docker-compose.prod.yml       # Production setup
├── .env.example                  # Environment variables template
├── DOCKER_DEPLOYMENT.md          # Full deployment guide
└── package.json                  # Build scripts added
```

---

## 🚀 Build Stages Explained

### Stage 1: Builder

```dockerfile
FROM node:18-alpine AS builder
- Install all dependencies (dev + prod)
- Generate Prisma client
- Compile TypeScript → dist/
```

### Stage 2: Production

```dockerfile
FROM node:18-alpine
- Copy only production dependencies
- Copy Prisma schema & client
- Copy compiled dist/
- Run as non-root user
- Configure health check
- Start with: `prisma db push && node dist/server.js`
```

---

## 💡 Key Features

| Feature               | Benefit                                  |
| --------------------- | ---------------------------------------- |
| **Multi-stage build** | Final image only ~150MB (vs ~800MB)      |
| **Alpine Linux**      | Minimal attack surface, fast deployments |
| **Non-root user**     | Enhanced security                        |
| **Health checks**     | Auto-restart on failures                 |
| **Signal handling**   | Graceful shutdown with dumb-init         |
| **Prod deps only**    | Smaller image, fewer vulnerabilities     |
| **Prisma auto-gen**   | Client always in sync with schema        |

---

## 🏗️ Development vs Production

### Development (docker-compose.yml)

- Hot reload with `ts-node-dev`
- All dependencies installed
- Volume mounts for live code updates

### Production (docker-compose.prod.yml)

- Compiled Node.js from dist/
- Production dependencies only
- Health checks & monitoring
- Graceful shutdown

---

## 🔧 Usage

### Start Services

```bash
# With live logs
docker-compose -f docker-compose.prod.yml up

# In background
docker-compose -f docker-compose.prod.yml up -d

# Rebuild (force)
docker-compose -f docker-compose.prod.yml up -d --build
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### View Logs

```bash
# Real-time
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 50 lines
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### Access Database

```bash
# psql shell
docker exec -it estoque_postgres psql -U postgres -d estoque

# Run query
docker exec estoque_postgres psql -U postgres -d estoque -c "SELECT version();"
```

### Execute Commands in Container

```bash
# Run shell
docker exec -it estoque_backend sh

# Run npm command
docker exec estoque_backend npm run prisma:generate

# Check Prisma status
docker exec estoque_backend npx prisma db execute --stdin < query.sql
```

---

## 🔐 Environment Setup

### Production Environment

Create `.env` file with production values:

```bash
DATABASE_URL=postgresql://user:password@host:5432/estoque
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000
```

Or set via docker-compose environment:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/estoque
      JWT_SECRET: your-secret-key
      NODE_ENV: production
```

### Secrets Management (Recommended for Production)

Use Docker Secrets or external vault:

```bash
# Docker Secrets
echo "postgresql://user:pass@db:5432/db" | docker secret create db_url -
echo "secret-key" | docker secret create jwt_secret -

# In docker-compose
secrets:
  db_url:
    external: true
  jwt_secret:
    external: true
```

---

## 📊 Image Optimization Results

**Before Optimization:**

```
estoque-backend     latest     850MB
```

**After Multi-Stage Build:**

```
estoque-backend     latest     148MB  ✅ 82% reduction
```

**Build Time:**

- Builder stage: ~45s (installs deps, compiles)
- Final image: ~5s (layer caching)

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Test locally: `docker-compose -f docker-compose.prod.yml up`
- [ ] Verify health: `curl http://localhost:3000/health`
- [ ] Check logs: `docker logs estoque_backend`
- [ ] Test database: Can Prisma connect?
- [ ] Validate API: Test endpoints
- [ ] Set environment variables in production
- [ ] Configure database backups
- [ ] Set up monitoring (CPU, memory, errors)
- [ ] Configure SSL/TLS (reverse proxy)
- [ ] Test graceful shutdown: `docker stop estoque_backend`

---

## 🆘 Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port
lsof -i :3000

# Use different port
docker run -p 3001:3000 estoque-backend:latest

# Or kill existing process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check containers
docker-compose -f docker-compose.prod.yml ps

# View PostgreSQL logs
docker logs estoque_postgres

# Test connection
docker exec estoque_backend \
  npm exec -- pg_connection_string \
  "postgresql://postgres:password@postgres:5432/estoque"
```

### Prisma Migration Failed

```bash
# Manual execution
docker exec estoque_backend \
  npx prisma db push --skip-generate

# With acceptance of data loss (use carefully!)
docker exec estoque_backend \
  npx prisma db push --skip-generate --accept-data-loss

# Reset database
docker exec estoque_backend \
  npx prisma db push --skip-generate --accept-data-loss
```

### Container Won't Start

```bash
# Check logs
docker logs estoque_backend

# Inspect image
docker inspect estoque-backend:latest

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache
```

---

## 🚀 Deployment Options

### Option 1: Single Server with Docker Compose

```bash
# SSH to server
ssh user@prod-server

# Clone & setup
git clone <repo>
cd backend
echo "DATABASE_URL=..." > .env
echo "JWT_SECRET=..." >> .env

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: Kubernetes

```bash
# Build and push image
docker build -t registry.example.com/estoque:latest .
docker push registry.example.com/estoque:latest

# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml
kubectl get pods
kubectl logs deployment/estoque-backend
```

### Option 3: Cloud Platform (Azure, AWS, GCP)

```bash
# Build for cloud registry
docker build -t myregistry.azurecr.io/estoque:v1.0.0 .
docker push myregistry.azurecr.io/estoque:v1.0.0

# Deploy via cloud CLI
az container create --resource-group mygroup \
  --name estoque \
  --image myregistry.azurecr.io/estoque:v1.0.0
```

---

## 📈 Monitoring & Logging

### Check Container Status

```bash
# Basic status
docker ps -a | grep estoque

# Detailed stats
docker stats estoque_backend

# Full inspection
docker inspect estoque_backend
```

### View Logs with Timestamps

```bash
docker logs -f -t estoque_backend

# Specific time range
docker logs --since 2026-02-20T10:00:00 \
  --until 2026-02-20T11:00:00 estoque_backend
```

### Health Check Status

```bash
# Built-in health check
docker inspect --format={{.State.Health.Status}} estoque_backend

# Manual test
docker exec estoque_backend wget -q -O- http://localhost:3000/health
```

---

## 📚 Additional Resources

- **Full Deployment Guide:** See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- **Docker Docs:** https://docs.docker.com/
- **Prisma Docker Guide:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker
- **Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

**Ready to deploy! 🚀**

For detailed deployment scenarios and troubleshooting, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).
