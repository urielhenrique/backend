#!/bin/bash

# Este script obtém um certificado Let's Encrypt para o domínio
# Use: ./init-letsencrypt.sh seu-dominio.com

DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@${DOMAIN}"}

echo "🔐 Iniciando obtenção de certificado SSL para: $DOMAIN"

# Criar diretórios se não existirem
mkdir -p ./certbot_data ./certbot_www

# Se for localhost, criar certificado auto-assinado para testes
if [ "$DOMAIN" = "localhost" ]; then
  echo "⚠️  Usando localhost - gerando certificado auto-assinado para testes"
  openssl req -x509 -newkey rsa:4096 -nodes -out ./certbot_data/fullchain.pem -keyout ./certbot_data/privkey.pem -days 365 -subj "/CN=localhost"
  mkdir -p ./certbot_data/live/main
  cp ./certbot_data/fullchain.pem ./certbot_data/live/main/fullchain.pem
  cp ./certbot_data/privkey.pem ./certbot_data/live/main/privkey.pem
else
  # Para domínio real, usar certbot
  docker run -it --rm \
    -v ./certbot_data:/etc/letsencrypt \
    -v ./certbot_www:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly \
      --webroot -w /var/www/certbot \
      -d "$DOMAIN" \
      --email "$EMAIL" \
      --agree-tos \
      --no-eff-email
fi

echo "✅ Certificado configurado!"
echo "Agora execute: docker-compose -f docker-compose.prod.yml up -d"
