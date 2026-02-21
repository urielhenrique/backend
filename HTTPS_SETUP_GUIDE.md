# 🚀 Guia de Deploy em Produção com HTTPS

## Problema

O frontend estava tentando conectar via HTTPS (sslip.io) com certificado inválido, causando erro `net::ERR_CERT_AUTHORITY_INVALID`.

## Solução

Configurado um **reverse proxy Nginx** com **Let's Encrypt** para gerenciar HTTPS automaticamente no domínio **api.barstock.coderonin.com.br**.

---

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Domínio `api.barstock.coderonin.com.br` apontando para o IP do servidor
- Acesso SSH ao servidor (para execução remota)

---

## 🔧 Configuração Passo a Passo

### 1️⃣ **Prepare seu domínio**

Verifique se `api.barstock.coderonin.com.br` aponta para o IP do servidor:

```bash
# Teste a resolução do domínio
nslookup api.barstock.coderonin.com.br
```

---

### 2️⃣ **Obtenha um certificado SSL válido**

**Opção A:** Em servidor Linux com acesso externo (RECOMENDADO)

```bash
cd /caminho/para/backend
bash init-letsencrypt.sh api.barstock.coderonin.com.br admin@coderonin.com.br
```

**Opção B:** Manualmente com certbot

```bash
docker run -it --rm \
  -v $(pwd)/certbot_data:/etc/letsencrypt \
  -v $(pwd)/certbot_www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    -d api.barstock.coderonin.com.br \
    --email admin@coderonin.com.br \
    --agree-tos \
    --no-eff-email
```

**Opção C:** Para testes locais (habilita auto-assinado)

```bash
bash init-letsencrypt.sh localhost
```

---

### 3️⃣ **Atualize o frontend**

Já foi atualizado em `.env.production`:

```bash
VITE_API_URL=https://api.barstock.coderonin.com.br
```

✅ Configurado e pronto para usar!

---

### 4️⃣ **Inicie os containers**

```bash
# Parar containers antigos (se houver)
docker-compose -f docker-compose.prod.yml down

# Iniciar tudo
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml logs -f
```

---

### 5️⃣ **Teste a conexão**

```bash
# Testar o backend via HTTPS
curl -k https://api.barstock.coderonin.com.br/health

# Testar o frontend
# Abra no navegador: https://api.barstock.coderonin.com.br
```

---

## 🔄 O que mudou?

### Antes ❌

```
Frontend (HTTPS sslip.io) → ❌ Certificado inválido
Backend (HTTP:3000)      → Sem proteção
```

### Depois ✅

```
Frontend (HTTPS dominio.com) → Nginx (443) → [Certificado Let's Encrypt] → Backend (HTTP:3000)
ClientBrowser                  ↓
                       Redireciona HTTP→HTTPS
```

---

## 📦 Estrutura de Containers

| Container    | Porta          | Função                             |
| ------------ | -------------- | ---------------------------------- |
| **nginx**    | 80, 443        | Proxy reverso + SSL                |
| **backend**  | 3000 (interna) | API Node.js                        |
| **postgres** | 5433           | Banco de dados                     |
| **certbot**  | -              | Renova certificado automaticamente |

---

## 🔐 Renovação Automática de Certificado

O Certbot está configurado para renovar automaticamente a cada 12 horas:

```bash
# Ver status de renovação
docker-compose -f docker-compose.prod.yml logs certbot

# Renovar manualmente (se necessário)
docker-compose -f docker-compose.prod.yml exec certbot \
  certbot renew --webroot -w /var/www/certbot --force-renewal
```

---

## 🚨 Troubleshooting

### Erro: "Certificate not found"

```bash
# Verifique se os certificados foram criados
ls -la ./certbot_data/live/main/

# Se não existirem, execute novamente:
bash init-letsencrypt.sh api.barstock.coderonin.com.br admin@coderonin.com.br
```

### Erro: "Connection refused"

```bash
# Verifique se nginx está rodando
docker-compose -f docker-compose.prod.yml ps

# Veja os logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### Frontend ainda dá erro de certificado

1. ✅ Certificado foi obtido com sucesso?
2. ✅ Frontend aponta para URL correta em `.env.production`?
3. ✅ Você fez rebuild do frontend? (`npm run build`)
4. ✅ Certificado é válido para o domínio que está usando?

---

## 📚 Arquivos Modificados

```
backend/
├── docker-compose.prod.yml  ← Adicionado nginx + certbot
├── nginx.conf               ← Novo: Proxy reverso SSL
├── init-letsencrypt.sh      ← Novo: Script de inicialização
└── .env.production          ← Novo: Documentação

web/
├── .env.production          ← Alterado: HTTPS + domínio correto
```

---

## ⚙️ Configurações Importantes

### nginx.conf

- Redireciona HTTP → HTTPS
- Proxy reverso para backend:3000
- Suporte a WebSocket (se necessário)
- Limita tamanho de upload: 100MB

### docker-compose.prod.yml

- Backend expõe apenas para nginx (não na porta 3000)
- Nginx gerencia portas 80/443
- Certbot renova automaticamente
- Volumes compartilhados para certificados

---

## 💡 Dicas

1. **Teste antes de produção:**

   ```bash
   docker-compose -f docker-compose.yml up -d  # Desenvolvimento
   ```

2. **Monitore logs em tempo real:**

   ```bash
   docker-compose -f docker-compose.prod.yml logs -f nginx
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

3. **Backup de certificados:**

   ```bash
   tar czf certs-backup.tar.gz certbot_data/
   ```

4. **Atualizações seguras:**
   ```bash
   git pull
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

---

## ✅ Checklist Final

- [ ] Domínio `api.barstock.coderonin.com.br` apontando para o servidor
- [ ] Certificado SSL obtido com: `bash init-letsencrypt.sh api.barstock.coderonin.com.br admin@coderonin.com.br`
- [ ] Frontend `.env.production` atualizado: `VITE_API_URL=https://api.barstock.coderonin.com.br`
- [ ] Frontend reconstruído (`npm run build`)
- [ ] Docker containers iniciados (`docker-compose -f docker-compose.prod.yml up -d`)
- [ ] HTTPS funcionando (`curl -v https://api.barstock.coderonin.com.br/health`)
- [ ] Login no frontend funciona sem erros

---

## 🆘 Suporte

Se ainda tiver problemas:

1. Confirme que está usando **HTTPS** e não HTTP
2. Verifique se `api.barstock.coderonin.com.br` está **resolvendo** corretamente
3. Aguarde alguns minutos para Let's Encrypt propagar
4. Tente acessar em modo **incógnito** (limpa cache)
5. Verifique os **logs do nginx**: `docker-compose -f docker-compose.prod.yml logs nginx`

---

**Status:** ✅ HTTPS Seguro Configurado  
**Domínio:** api.barstock.coderonin.com.br  
**Certificado:** Let's Encrypt (gratuito e automático)  
**Renovação:** Automática a cada 12 horas
