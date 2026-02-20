.PHONY: help docker-build docker-up docker-down docker-logs docker-shell docker-test docker-clean docker-stats

help:
	@echo "Estoque Backend Docker Commands"
	@echo "================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Run development environment"
	@echo "  make dev-stop         - Stop development environment"
	@echo "  make dev-logs         - View development logs"
	@echo ""
	@echo "Production:"
	@echo "  make prod-build       - Build production image"
	@echo "  make prod-up          - Start production environment"
	@echo "  make prod-down        - Stop production environment"
	@echo "  make prod-logs        - View production logs"
	@echo ""
	@echo "Docker Operations:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-shell     - Access container shell"
	@echo "  make docker-stats     - Show container stats"
	@echo "  make docker-clean     - Clean Docker resources"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell         - Access PostgreSQL shell"
	@echo "  make db-backup        - Backup database"
	@echo "  make db-restore FILE  - Restore database (FILE=backup.sql)"
	@echo ""

# Development targets
dev:
	docker-compose up

dev-stop:
	docker-compose down

dev-logs:
	docker-compose logs -f

dev-build:
	docker-compose build

# Production targets
prod-build:
	docker-compose -f docker-compose.prod.yml build --no-cache

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f backend

prod-restart:
	docker-compose -f docker-compose.prod.yml restart backend

prod-status:
	docker-compose -f docker-compose.prod.yml ps

# Docker operations
docker-build:
	docker build -t estoque-backend:latest .

docker-shell:
	docker exec -it estoque_backend sh

docker-stats:
	docker stats estoque_backend

docker-clean:
	docker system prune -f --volumes

# Database operations
db-shell:
	docker exec -it estoque_postgres psql -U postgres -d estoque

db-backup:
	@mkdir -p ./backups
	docker exec estoque_postgres pg_dump -U postgres -d estoque > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make db-restore FILE=path/to/backup.sql"; \
	else \
		cat $(FILE) | docker exec -i estoque_postgres psql -U postgres -d estoque; \
		echo "Database restored from $(FILE)"; \
	fi

db-migrate:
	docker exec estoque_backend npx prisma db push --skip-generate

db-reset:
	docker exec estoque_backend npx prisma db push --skip-generate --accept-data-loss

# Utility targets
logs:
	docker-compose logs -f backend

test-api:
	curl http://localhost:3000/health

version:
	docker -v
	docker-compose -v

reset:
	@echo "Resetting all containers and volumes..."
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f --volumes
	@echo "Reset complete"

inspect-image:
	docker image inspect estoque-backend:latest

size:
	docker images estoque-backend

history:
	docker history estoque-backend:latest
