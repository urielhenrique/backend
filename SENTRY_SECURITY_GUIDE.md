# 🔐 Guia de Segurança - Configuração Sentry (Repositório Público)

**Data**: 4 de março de 2026  
**Status**: Repositório GitHub Público - Configuração Segura

---

## ✅ Segurança Atual do Repositório

### Arquivos Protegidos (já configurado)

```
✅ backend/.gitignore → bloqueia .env e .env.local
✅ bar-controle-web/.gitignore → bloqueia .env e .env.*
```

**Resultado**: Suas credenciais NÃO serão commitadas no GitHub

---

## 🚨 IMPORTANTE: DSNs que Você Forneceu NÃO São Válidos

Você forneceu:

```
❌ https://api.barstock.coderonin.com.br/
❌ https://barstock.coderonin.com.br/
```

**Estes não são DSNs do Sentry!** São URLs do seu próprio projeto.

### DSN Válido do Sentry Tem Este Formato:

```
✅ https://<public_key>@<domain>.ingest.sentry.io/<project_id>

Exemplo:
https://abcd1234efgh5678@o123456.ingest.sentry.io/789012
        ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^
        Chave Pública   Domínio Sentry            Projeto
```

---

## 📋 Passo a Passo: Configuração Segura

### **1. Criar Projetos no Sentry.io**

```bash
# 1. Acesse: https://sentry.io/signup/
# 2. Crie uma organização (grátis)
# 3. Crie 2 projetos:

Projeto 1: Backend
- Platform: Node.js
- Nome sugerido: barstock-backend

Projeto 2: Frontend
- Platform: React
- Nome sugerido: barstock-frontend
```

### **2. Copiar os DSNs**

Após criar cada projeto, Sentry mostra a página "Configure SDK":

```
Backend DSN (exemplo):
https://1a2b3c4d5e6f7g8h@o987654.ingest.sentry.io/123456

Frontend DSN (exemplo):
https://9z8y7x6w5v4u3t2s@o987654.ingest.sentry.io/654321
```

### **3. Configurar Localmente (SEGURO)**

#### Backend

```bash
# 1. Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# 2. Edite backend/.env e adicione seu DSN REAL:
SENTRY_DSN=https://seu-dsn-backend-aqui@o123456.ingest.sentry.io/789012
NODE_ENV=development

# 3. NUNCA comite backend/.env (já está no .gitignore)
```

#### Frontend

```bash
# 1. Copie o arquivo de exemplo
cp bar-controle-web/.env.example bar-controle-web/.env

# 2. Edite bar-controle-web/.env e adicione seu DSN REAL:
VITE_SENTRY_DSN=https://seu-dsn-frontend-aqui@o123456.ingest.sentry.io/345678
VITE_ENVIRONMENT=development

# 3. NUNCA comite bar-controle-web/.env (já está no .gitignore)
```

---

## 🔒 O Que Commitar no GitHub (Seguro)

### ✅ PODE Commitar:

```
✅ .env.example (sem valores reais)
✅ Toda a implementação do Sentry
✅ Documentação
✅ Código que lê process.env.SENTRY_DSN
✅ .gitignore
```

### ❌ NUNCA Commitar:

```
❌ .env
❌ .env.local
❌ .env.production
❌ Qualquer arquivo com DSNs reais
❌ Tokens ou API keys
❌ Senhas ou secrets
```

---

## 🌐 Deployment (Produção)

### Docker / Coolify

```yaml
# docker-compose.yml ou Coolify Environment
environment:
  SENTRY_DSN: ${SENTRY_DSN} # Variável de ambiente
  NODE_ENV: production
  VITE_SENTRY_DSN: ${VITE_SENTRY_DSN}
  VITE_ENVIRONMENT: production
```

### Configurar no Coolify/Server:

```bash
# 1. Acesse painel do Coolify
# 2. Vá em: Projeto → Environment Variables
# 3. Adicione:
SENTRY_DSN=https://seu-dsn-prod@o123456.ingest.sentry.io/789012
VITE_SENTRY_DSN=https://seu-dsn-frontend@o123456.ingest.sentry.io/345678
```

**IMPORTANTE**: Configure diretamente no painel, NÃO no código!

---

## 🧪 Testar com DSN Real

### Local (Development)

```bash
# 1. Configure .env com DSN real do Sentry
# 2. Inicie o backend:
cd backend && npm run dev

# 3. Teste o endpoint:
curl http://localhost:3001/internal/monitoring/test-error

# 4. Vá para Sentry.io → Issues
# Você deve ver o erro em 1-2 segundos
```

### Verificar Sentry Dashboard

```
1. Acesse: https://sentry.io/organizations/sua-org/issues/
2. Filtre por Environment: development
3. Procure por: "Test error from Sentry monitoring endpoint"
```

---

## 🎯 DSN do Frontend É Público? Sim, e Está OK!

### Por Que o Frontend DSN é Diferente?

```diff
Backend DSN:
+ Privado - apenas servidor acessa
+ Nunca exposto ao navegador
+ Mantido em .env (protegido)

Frontend DSN:
+ Público - código JavaScript do navegador
+ Intencionalmente exposto (bundled no código)
+ Sentry VALIDA por domínio configurado
+ Só aceita erros do domínio autorizado
```

### Configuração no Sentry.io para Proteger Frontend:

```
1. Vá em: https://sentry.io/settings/projects/seu-frontend/security-headers/
2. Configure "Allowed Domains":
   - https://barstock.coderonin.com.br
   - http://localhost:5173 (dev)
3. Salve

Agora apenas esses domínios podem enviar erros
```

---

## 📝 Checklist de Segurança

Antes de fazer push para GitHub:

- [ ] `.env` está no `.gitignore`?
- [ ] `.env.example` não contém DSNs reais?
- [ ] Nenhum DSN hardcoded no código?
- [ ] Testou que `.env` não sobe no commit?
- [ ] Configurou DSNs no servidor/Coolify?
- [ ] Frontend domains configurados no Sentry?

---

## 🧐 Como Verificar Que Nada Vazou

### Buscar no Código:

```bash
# Procure por DSNs hardcoded (não deve retornar nada):
grep -r "ingest.sentry.io" backend/src/
grep -r "ingest.sentry.io" bar-controle-web/src/

# Verificar .gitignore:
cat backend/.gitignore | grep .env
cat bar-controle-web/.gitignore | grep .env
```

### Testar Commit:

```bash
# Simule um commit sem fazer push:
git add .
git status

# Verifique se .env aparece:
# Se aparecer: ❌ PARE! .gitignore não está funcionando
# Se NÃO aparecer: ✅ Seguro para commitar
```

---

## 🆘 E Se Eu Commitei um DSN por Engano?

### Ação Imediata:

```bash
# 1. REVOGUE o DSN imediatamente no Sentry.io:
https://sentry.io/settings/projects/seu-projeto/keys/

# 2. Clique em "Revoke" ao lado da DSN comprometida

# 3. Crie uma nova DSN

# 4. Atualize seus arquivos .env locais

# 5. Remova do histórico do Git (opcional mas recomendado):
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 6. Force push (CUIDADO!)
git push --force --all
```

---

## 📚 Resumo Rápido

```bash
# 1. Crie projetos em https://sentry.io/
# 2. Copie os DSNs (formato: https://key@domain.ingest.sentry.io/id)
# 3. Cole em .env (local) - NÃO em .env.example
# 4. Teste: curl http://localhost:3001/internal/monitoring/test-error
# 5. Configure DSNs no servidor via painel (Coolify/Docker env)
# 6. Commit APENAS .env.example (sem valores reais)
```

---

## ✅ Confirmação Final

Seu repositório JÁ está seguro:

- ✅ `.gitignore` configurado corretamente
- ✅ `.env` bloqueado
- ✅ Implementação Sentry segura (sem hardcode)
- ✅ `.env.example` criado (valores de exemplo)

**Próximo passo**: Obtenha DSNs reais do Sentry.io e configure localmente.

---

## 🔗 Links Úteis

- Sentry.io Signup: https://sentry.io/signup/
- Sentry Docs (Node): https://docs.sentry.io/platforms/node/
- Sentry Docs (React): https://docs.sentry.io/platforms/javascript/guides/react/
- Security Best Practices: https://docs.sentry.io/product/security-policy-reporting/

---

**Dúvidas?** Consulte [SENTRY_INTEGRATION.md](./SENTRY_INTEGRATION.md) ou [SENTRY_QUICK_START.md](./SENTRY_QUICK_START.md)
