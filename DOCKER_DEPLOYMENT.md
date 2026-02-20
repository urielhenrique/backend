# 🚀 Production Deployment Guide - Docker

## 📋 Overview

Multi-stage optimized Docker setup for production deployment of Node.js + Express + Prisma backend.

### Key Features

- ✅ Multi-stage build (builder + production)
- ✅ Alpine Linux for minimal image size (~150MB)
- ✅ Non-root user for security
- ✅ Health checks configured
- ✅ Proper signal handling with dumb-init
- ✅ Production dependencies only
- ✅ Prisma client auto-generated
- ✅ Database migrations before startup

---

## 🏗️ Architecture

```
Dockerfile (Multi-stage):
  ├─ Stage 1: Builder
  │  ├─ Install all dependencies (dev + prod)
  │  ├─ Generate Prisma client
  │  ├─ Copy source code
  │  └─ Compile TypeScript → dist/
  │
  └─ Stage 2: Production
     ├─ Copy only production dependencies
     ├─ Copy Prisma schema
     ├─ Copy built dist/
     ├─ Create non-root user
     └─ CMD: prisma db push + node dist/server.js
```

---

## 📦 Build & Run

### Option 1: Using docker-compose (Recommended)

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up --build

# Run in background
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop containers
docker-compose -f docker-compose.prod.yml down
```

### Option 2: Manual Docker commands

```bash
# Build image
docker build -t estoque-backend:latest .

# Run container
docker run -d \
  --name estoque_backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:password@db:5432/estoque" \
  -e JWT_SECRET="your-secret-key" \
  --restart always \
  estoque-backend:latest

# View logs
docker logs -f estoque_backend
```

---

## 🔧 Environment Variables

Create `.env.prod` file:

```bash
# Database
DATABASE_URL=postgresql://postgres:securepassword@postgres:5432/estoque

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Node
NODE_ENV=production
PORT=3000
```

### Docker Compose Variables

```bash
# In docker-compose.prod.yml, set env vars:
DB_USER=postgres
DB_PASSWORD=securepassword
DB_NAME=estoque
DB_PORT=5432
DATABASE_URL=postgresql://postgres:securepassword@postgres:5432/estoque
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

---

## 📊 Image Size Comparison

```
Without optimization:  ~800MB
Builder stage only:    ~650MB (with all dependencies)
Production final:      ~150MB (optimized, production only)
```

---

## 🏥 Health Checks

### Container Health

The Dockerfile includes built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```

Check container health:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"

# Output: estoque_backend    Up 2 hours (healthy)
```

### Application Health Endpoint

```bash
curl http://localhost:3000/health
# Response: {"status":"ok"}
```

---

## 🔐 Security Features

### 1. Non-Root User

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

- Application runs as `nodejs` user (UID 1001)
- Prevents privilege escalation
- Limits damage if container is compromised

### 2. Minimal Base Image

```dockerfile
FROM node:18-alpine
```

- Alpine Linux: ~5MB (vs ~325MB for Ubuntu)
- Reduced attack surface
- Smaller image = faster deployments

### 3. Signal Handling

```dockerfile
ENTRYPOINT ["dumb-init", "--"]
```

- Properly handles SIGTERM/SIGKILL
- Ensures graceful shutdown
- Prevents zombie processes

### 4. Production Dependencies Only

```bash
npm ci --only=production
```

- No dev dependencies in final image
- Smaller image size
- Reduced vulnerabilities

---

## 📈 Performance Optimization

### 1. Alpine Linux Base

```dockerfile
FROM node:18-alpine  # ~150MB
# vs
FROM node:18        # ~950MB
```

### 2. npm ci (instead of npm install)

```bash
RUN npm ci --only=production
```

- Faster, more reproducible
- Exact versions from lock file
- Production-optimized

### 3. Build Cache Optimization

```dockerfile
# Copy package files first (rarely changes)
COPY package*.json ./

# Install deps (cache this layer)
RUN npm ci --only=production

# Copy source (changes frequently)
COPY src ./src
```

---

## 🚀 Deployment Scenarios

### Scenario 1: Single Server Deployment

```bash
# SSH into server
ssh user@production-server

# Clone repo
git clone <repo-url>
cd backend

# Create .env.prod
echo "DATABASE_URL=..." > .env.prod
echo "JWT_SECRET=..." >> .env.prod

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Scenario 2: Kubernetes Deployment

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: estoque-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: estoque-backend
  template:
    metadata:
      labels:
        app: estoque-backend
    spec:
      containers:
        - name: backend
          image: estoque-backend:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: estoque-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: estoque-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 40
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 5
```

Deploy:

```bash
kubectl apply -f k8s-deployment.yaml
```

### Scenario 3: Docker Registry Push

```bash
# Build image
docker build -t estoque-backend:latest .

# Tag for registry
docker tag estoque-backend:latest myregistry.azurecr.io/estoque-backend:latest
docker tag estoque-backend:latest myregistry.azurecr.io/estoque-backend:v1.0.0

# Push to registry
docker push myregistry.azurecr.io/estoque-backend:latest
docker push myregistry.azurecr.io/estoque-backend:v1.0.0

# Pull and run
docker pull myregistry.azurecr.io/estoque-backend:latest
docker run -d myregistry.azurecr.io/estoque-backend:latest
```

---

## 🔍 Debugging Production Container

### View Logs

```bash
# Real-time logs
docker logs -f estoque_backend

# Last 100 lines
docker logs --tail 100 estoque_backend

# With timestamps
docker logs -f --timestamps estoque_backend
```

### Execute Commands in Container

```bash
# Access shell
docker exec -it estoque_backend sh

# Check Prisma status
docker exec estoque_backend npx prisma db execute --stdin < query.sql

# Run Prisma commands
docker exec estoque_backend npx prisma db push --skip-generate
```

### Inspect Image

```bash
# Layers and size
docker history estoque-backend:latest

# Image details
docker inspect estoque-backend:latest

# Size of image
docker images estoque-backend
```

---

## 📋 Maintenance

### Database Backups

```bash
# Backup PostgreSQL
docker exec estoque_postgres pg_dump \
  -U postgres -d estoque > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat backup_20260220_120000.sql | \
  docker exec -i estoque_postgres \
  psql -U postgres -d estoque
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Monitor Container Resources

```bash
# Real-time stats
docker stats estoque_backend

# Container info
docker ps --format \
  "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Port 3000 already in use"

```bash
# Find process using port
lsof -i :3000

# Kill process or use different port
docker run -p 3001:3000 ...
```

### Issue 2: "Database connection timeout"

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database connectivity
docker exec estoque_backend \
  npm exec -- sqlspell \
  "postgresql://postgres:password@postgres:5432/estoque"

# Or manually test
docker exec -it estoque_postgres \
  psql -U postgres -d estoque -c "SELECT 1"
```

### Issue 3: "Prisma migrations fail"

```bash
# Manual migration
docker exec estoque_backend \
  npx prisma db push --skip-generate

# Reset database (careful!)
docker exec estoque_backend \
  npx prisma db push --skip-generate --accept-data-loss

# Inspect database
docker exec estoque_backend \
  npx prisma db execute --stdin < "SELECT * FROM schema_migrations;"
```

### Issue 4: "Out of memory"

```bash
# Increase container memory
docker update --memory="2g" estoque_backend

# Or in docker-compose:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 📊 Production Checklist

- [x] **Dockerfile**: Multi-stage, optimized for production
- [x] **Health checks**: Built-in container health check
- [x] **Security**: Non-root user, minimal base image
- [x] **Signal handling**: dumb-init for graceful shutdown
- [x] **Environment**: Configurable via environment variables
- [x] **Database**: Prisma db push before startup
- [ ] **Logging**: Consider ELK stack or CloudWatch
- [ ] **Monitoring**: Set up alerts (CPU, memory, error rates)
- [ ] **Backup**: Database backup strategy
- [ ] **SSL/TLS**: Configure reverse proxy (nginx/traefik)
- [ ] **Load balancing**: For multiple instances
- [ ] **Auto-scaling**: Based on metrics

---

## 🎯 Next Steps

1. **Test locally:** `docker-compose -f docker-compose.prod.yml up`
2. **Verify health:** `curl http://localhost:3000/health`
3. **Test API:** Make requests to endpoints
4. **Monitor logs:** `docker logs -f estoque_backend`
5. **Push to registry:** Tag and push to container registry
6. **Deploy:** Use docker-compose, Kubernetes, or cloud provider

---

**Ready for production! 🚀**
