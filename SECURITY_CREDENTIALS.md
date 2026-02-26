# 🔒 Segurança de Credenciais - IMPORTANTE!

## ⚠️ NUNCA COMMITE O ARQUIVO .env

### ✅ O Que Está Protegido

Seu projeto está configurado corretamente:

```gitignore
# .gitignore já contém:
.env
.env.local
.env.*.local
```

Isso significa que o arquivo `.env` com suas credenciais **NUNCA será enviado ao GitHub**.

---

## 🔐 Credenciais Sensíveis no Projeto

### Atualmente Configuradas:

1. **Resend API Key**
   - Valor: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (mascarada por segurança)
   - Localização: `.env` (PROTEGIDO)
   - Uso: Envio de emails

2. **Stripe Secret Key**
   - Localização: `.env` (PROTEGIDO)
   - Uso: Processamento de pagamentos

3. **Stripe Webhook Secret**
   - Localização: `.env` (PROTEGIDO)
   - Uso: Verificação de webhooks

4. **Google Client ID**
   - Localização: `.env` (PROTEGIDO)
   - Uso: Login com Google

5. **JWT Secret**
   - Localização: `.env` (PROTEGIDO)
   - Uso: Autenticação de usuários

---

## ✅ Verificações de Segurança Antes de Cada Commit

### 1. Verifique o .gitignore

```bash
# O .env deve estar listado
cat .gitignore | grep "\.env"
```

**Output esperado:**

```
.env
.env.local
.env.*.local
```

### 2. Verifique o que será commitado

```bash
# NUNCA deve aparecer .env aqui
git status
```

**SE APARECER `.env`:**

```bash
# Adicione ao .gitignore imediatamente
echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: add .env to gitignore"
```

### 3. Verifique se .env já foi commitado antes

```bash
# Procurar .env no histórico
git log --all --full-history -- .env
```

**Se encontrar algo:**

```bash
# Remover do histórico (CUIDADO - reescreve histórico)
git filter-branch --index-filter \
  "git rm -rf --cached --ignore-unmatch .env" HEAD

# Ou use git-filter-repo (mais seguro):
git filter-repo --path .env --invert-paths
```

---

## 🚨 O Que Fazer Se Você Acidentalmente Commitou Credenciais

### PASSO 1: REVOGAR TODAS AS CREDENCIAIS IMEDIATAMENTE

1. **Resend API Key**
   - Acesse: https://resend.com/api-keys
   - Delete a key: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (sua chave atual)
   - Gere uma nova
   - Atualize o `.env`

2. **Stripe Keys**
   - Acesse: https://dashboard.stripe.com/test/apikeys
   - Revogue as chaves antigas
   - Gere novas chaves
   - Atualize o `.env`

3. **JWT Secret**
   - Gere um novo secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   - Atualize o `.env`
   - **AVISO:** Isso invalidará todas as sessões ativas

4. **Google OAuth**
   - Acesse: https://console.cloud.google.com/apis/credentials
   - Revogue o Client ID
   - Crie um novo
   - Atualize o `.env`

### PASSO 2: REMOVER DO HISTÓRICO DO GIT

```bash
# Método 1: git filter-branch (tradicional)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Método 2: BFG Repo-Cleaner (mais rápido)
# Instale: https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files .env

# Método 3: git-filter-repo (recomendado)
# Instale: pip install git-filter-repo
git filter-repo --path .env --invert-paths

# Depois de qualquer método, force push
git push origin --force --all
git push origin --force --tags
```

### PASSO 3: NOTIFICAR O GITHUB

1. Acesse: https://github.com/urielhenrique/backend/settings/secrets
2. Se houver GitHub Secrets configurados, rotacione todos

---

## 🛡️ Prevenção: Checklist Antes de Cada Push

```bash
# 1. Verifique o que será commitado
git status

# 2. Veja o diff antes de commitar
git diff

# 3. Veja o que está staged
git diff --staged

# 4. NÃO deve aparecer .env em nenhum comando acima
```

### Script de Verificação Automática

Crie um arquivo `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Verificar se .env está sendo commitado
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "❌ ERRO: Tentativa de commitar .env detectada!"
  echo "⚠️  O arquivo .env contém credenciais sensíveis."
  echo "🚫 Commit bloqueado por segurança."
  exit 1
fi

# Verificar se há API keys no código
if git diff --cached | grep -iE "re_[A-Za-z0-9]{32,}"; then
  echo "❌ AVISO: Possível API key do Resend detectada no código!"
  echo "⚠️  Remova credenciais hard-coded antes de commitar."
  exit 1
fi

if git diff --cached | grep -iE "sk_test_[A-Za-z0-9]{32,}"; then
  echo "❌ AVISO: Possível API key do Stripe detectada no código!"
  echo "⚠️  Remova credenciais hard-coded antes de commitar."
  exit 1
fi

exit 0
```

Torne executável:

```bash
chmod +x .git/hooks/pre-commit
```

---

## 📋 Checklist de Segurança

### Antes de Fazer Deploy

- [ ] `.env` está no `.gitignore`
- [ ] `.env` NÃO está no repositório Git
- [ ] `.env.example` está no repositório (sem credenciais reais)
- [ ] Variáveis de ambiente configuradas no servidor de produção
- [ ] Credenciais de produção são diferentes das de desenvolvimento
- [ ] JWT_SECRET de produção é diferente do de desenvolvimento
- [ ] Chaves do Stripe são as de produção (não test)
- [ ] Pre-commit hook instalado

### No Servidor de Produção

- [ ] Variáveis de ambiente configuradas via painel/CLI (não .env commitado)
- [ ] `.env` com permissões restritas (chmod 600)
- [ ] Backups de credenciais em local seguro
- [ ] Documentação de onde obter cada credencial

---

## 🚀 Configurando Ambiente de Produção

### Opção 1: Variáveis de Ambiente do Sistema

```bash
# No servidor de produção
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."
export RESEND_API_KEY="..."
export STRIPE_SECRET_KEY="..."
export FRONTEND_URL="https://..."
```

### Opção 2: Docker Secrets

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
    env_file:
      - .env.production # NÃO commitar este arquivo
```

### Opção 3: Serviços de Gerenciamento de Secrets

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Google Cloud Secret Manager**
- **Azure Key Vault**

---

## 📝 Documentando Credenciais (Forma Segura)

### ✅ FAZER (no README ou docs):

```markdown
## Environment Variables

Create a `.env` file based on `.env.example`:

- `RESEND_API_KEY`: Get from https://resend.com
- `STRIPE_SECRET_KEY`: Get from https://dashboard.stripe.com
- `JWT_SECRET`: Generate with: `openssl rand -hex 32`
```

### ❌ NÃO FAZER:

```markdown
## Environment Variables

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx # ❌ NUNCA!
STRIPE_SECRET_KEY=sk_test_51T3... # ❌ NUNCA!
```

---

## 🔍 Auditoria de Segurança

### Verificar se há credenciais no código

```bash
# Procurar por possíveis API keys
git grep -i "api_key\|secret_key\|password\|token" -- '*.ts' '*.js' '*.json'

# Procurar por padrões de Resend
git grep -E "re_[A-Za-z0-9]{32,}"

# Procurar por padrões de Stripe
git grep -E "sk_(test|live)_[A-Za-z0-9]{32,}"

# Procurar .env no histórico
git log --all --full-history --source --all -- .env
```

---

## 📞 Emergência: Credenciais Expostas

### Ações Imediatas (em ordem)

1. **REVOGAR todas as credenciais expostas** (Resend, Stripe, Google, etc)
2. **Remover do Git** (filter-branch/BFG/filter-repo)
3. **Force push** para sobrescrever histórico
4. **Gerar novas credenciais**
5. **Atualizar .env local e produção**
6. **Monitorar uso indevido** (logs do Resend/Stripe)
7. **Documentar incidente**

### Contatos de Suporte

- **Resend:** support@resend.com
- **Stripe:** https://support.stripe.com
- **Google:** https://support.google.com

---

## ✅ Status Atual

### Seu projeto ESTÁ seguro porque:

✅ `.env` está no `.gitignore`  
✅ `.env` NÃO está commitado no repositório  
✅ `.env.example` está no repositório (sem credenciais reais)  
✅ API key do Resend está funcionando

### Próximos Passos de Segurança:

1. Instalar pre-commit hook (opcional)
2. Criar `.env.production` no servidor (não commitar)
3. Rotacionar credenciais a cada 90 dias
4. Documentar onde obter cada credencial

---

**Última atualização:** 26 de fevereiro de 2026  
**Status:** 🔒 Seguro - Credenciais protegidas
