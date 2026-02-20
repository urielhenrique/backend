#!/bin/bash

# Script para executar migrations do Prisma
# Deve ser executado antes de iniciar a aplicação

set -e

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL before running migrations"
  exit 1
fi

echo "🔄 Starting database migrations..."

# Executar push do Prisma
if npx prisma db push --skip-generate --skip-validate; then
  echo "✅ Database migrations completed successfully"
  exit 0
else
  echo "❌ Database migrations failed"
  exit 1
fi
