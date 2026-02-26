# 📧 Guia de Testes de Email - BarStock

## 3 Scripts Disponíveis

### 1️⃣ **test-email-local.js** - Menu Interativo Completo

**Recomendado para:** Aprender sobre o sistema de email

```bash
node test-email-local.js
```

**Funcionalidades:**

- Menu interativo com 7 opções
- Verificar configuração de email
- Visualizar estrutura de cada tipo de email
- Testar rate limiting
- Modo automático com `--auto`

**Exemplo:**

```bash
# Modo interativo
node test-email-local.js

# Modo automático (executa todos os testes)
node test-email-local.js --auto
```

---

### 2️⃣ **test-email-completo.js** - Suite Completa Automática

**Recomendado para:** Validação rápida antes de deploy

```bash
node test-email-completo.js
```

**Funcionalidades:**

- 8 testes automáticos executados em sequência
- Visualização clara de cada teste
- Geração de tokens com exemplo real
- Teste de envio em massa (bulk)
- Fallback de provedores
- Resumo final com instruções

**Output Esperado:**

```
✅ Email de verificação pronto para envio!
✅ Email de reset de senha pronto para envio!
✅ Email de upgrade pronto para envio!
✅ Sistema de email está totalmente testado!
✅ Pronto para produção! 🚀
```

---

### 3️⃣ **test-email-cli.js** - Teste Rápido via CLI (Em Breve)

**Recomendado para:** Testes ad-hoc durante desenvolvimento

```bash
# Testar email de verificação
node test-email-cli.js verify usuario@email.com

# Testar email de reset
node test-email-cli.js reset usuario@email.com

# Testar upgrade
node test-email-cli.js upgrade empresa@email.com

# Gerar token apenas
node test-email-cli.js token
```

---

## 🚀 Como Usar em Desenvolvimento

### Setup Inicial

1. **Certifique-se que o backend está rodando:**

```bash
npm run dev
```

2. **Em outro terminal, execute o teste:**

```bash
# Modo interativo
node test-email-local.js

# Ou testes automáticos
node test-email-completo.js
```

### Fluxo de Teste

#### 1. Verificar Configuração

```bash
# Opção 1 do menu
node test-email-local.js
# Escolha: 1
```

**O que verificar:**

- ✅ RESEND_API_KEY ou SMTP configurados?
- ✅ FRONTEND_URL está correto?
- ✅ SMTP_FROM está definido?

#### 2. Testar Email de Verificação

```bash
# Opção 2 do menu
node test-email-local.js
# Escolha: 2
```

**O que fazer:**

- Observe o token gerado
- Veja o link de verificação
- Teste localmente acessando o link

#### 3. Testar Email de Reset

```bash
# Opção 3 do menu
node test-email-local.js
# Escolha: 3
```

**O que fazer:**

- Observe o token (válido por 15 min)
- Veja o link de reset
- Teste localmente acessando o link

#### 4. Testar Todos de Uma Vez

```bash
node test-email-completo.js
```

---

## 🔐 Entendendo Tokens

### Geração e Hashing

```
1. Sistema gera TOKEN RAW (64 hex chars = 32 bytes)
   Exemplo: b640231c9392dc4767a9eea97f0c602e017c15dbbe6c983591e8e8f1200e03a3

2. Sistema HASH o token (SHA256)
   Exemplo: 9cf14059aab9613662ec8d...

3. TOKEN RAW é enviado por email ao usuário
   Link: /verify-email?token=<TOKEN_RAW>

4. TOKEN HASHED é armazenado no banco de dados
   Preserva segurança mesmo se email for interceptado

5. Na verificação, sistema:
   - Recebe TOKEN RAW do usuário
   - Faz HASH novamente
   - Compara com HASH no banco
   - Se coincidirem → Válido!
```

### Segurança dos Tokens

- **Raw tokens**: Enviados por email (não armazenados em plaintext)
- **Hashed tokens**: Armazenados no BD (impossível recuperar original)
- **Expiração**: 1 hora para email, 15 minutos para reset
- **Proteção**: Mesmo interceptando o email, token not pode ser reutilizado em outro usuário

---

## 📊 Testing Different Email Types

### Email de Verificação

- **Payload**: Email + Token
- **Validade**: 1 hora
- **Ação**: Ativa conta
- **Link**: `/verify-email?token=...`

### Email de Reset de Senha

- **Payload**: Email + Token
- **Validade**: 15 minutos
- **Ação**: Permite redefinir senha
- **Link**: `/reset-password?token=...`

### Email de Upgrade PRO

- **Payload**: Email + Dados da empresa
- **Validade**: Sem expiração
- **Ação**: Notificação de upgrade
- **Conteúdo**: Lista de recursos liberados

---

## 🔄 Rate Limiting Testado

O sistema valida e testa automaticamente:

```
Login:           5 tentativas por 15 minutos
Forgot Password: 3 tentativas por 60 minutos
Email Verify:    Sem limite (seguro)
```

**Como testar:**

```bash
# Execute test-email-completo.js
# Opção 5 mostrar limites configurados

node test-email-completo.js
```

---

## ⚙️ Configurando Provedores

### Opção 1: Resend (Recomendado)

1. Acesse: https://resend.com
2. Crie conta e obtenha API key
3. Adicione ao `.env`:

```env
RESEND_API_KEY=re_sua_chave_aqui
SMTP_FROM=noreply@mail.coderonin.com.br
FRONTEND_URL=https://app.barstock.com.br
```

4. Salve e reinicie a aplicação
5. Agora emails serão enviados REALMENTE

### Opção 2: SMTP (Gmail, Outlook, etc)

**Exemplo com Gmail:**

1. Habilite "Less secure apps" ou use Google App Password
2. Adicione ao `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_app_password
SMTP_FROM=seu_email@gmail.com
FRONTEND_URL=http://localhost:5173
```

**Exemplo com SendGrid:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.sua_chave_aqui
SMTP_FROM=noreply@mail.coderonin.com.br
```

3. Salve e reinicie
4. Teste e valide

---

## 🧪 Exemplos de Teste

### Teste 1: Verificação Completa

```bash
# 1. Iniciar testes
node test-email-completo.js

# 2. Observar output
# ✅ Email de verificação pronto para envio!
# ✅ Email de reset de senha pronto para envio!
# ... etc

# 3. Sistema validado!
```

### Teste 2: Testar Tipo Específico

```bash
# 1. Iniciar menu
node test-email-local.js

# 2. Escolher opção:
#    1 - Verificar config
#    2 - Email de verificação
#    3 - Email de reset
#    4 - Email de upgrade
#    5 - Rate limiting
#    6 - Test simulado
#    7 - Executar todos

# 3. Analisar resultado
```

### Teste 3: Desenvolvimento Contínuo

```bash
# Verificar rápido durante codificação
node test-email-completo.js

# Se algo quebrou, saberá em segundos
# Se tudo OK, pronto para commit
```

---

## 🐛 Troubleshooting

### "Nenhum provedor configurado"

**Solução:**

```bash
# 1. Abra .env
# 2. Adicione RESEND_API_KEY ou SMTP_*
# 3. Salve
# 4. Reinicie aplicação
node test-email-completo.js # Must show provider configured
```

### "SMTP falhou"

**Verificar:**

- ✅ SMTP_HOST correto?
- ✅ SMTP_PORT correto (587 ou 465)?
- ✅ SMTP_USER e PASSWORD corretos?
- ✅ Firewall permite porta?

**Teste:**

```bash
# Ir para opção 1 (Verificar config)
node test-email-local.js
# Escolha: 1
# Procure por SMTP configurado: ✓ ou ✗
```

### "Link de verificação não funciona"

**Verificar:**

- ✅ FRONTEND_URL é pública/acessível?
- ✅ Token foi gerado corretamente?
- ✅ Banco de dados tem o token hashed?

**Teste:**

```bash
# Executar teste de verificação
node test-email-local.js
# Escolha: 2
# Copie o link gerado
# Abra em navegador
# Frontend deve processar o token
```

---

## ✨ Checklist Antes do Deploy

- [ ] `node test-email-completo.js` passou?
- [ ] Provedor (Resend ou SMTP) configurado?
- [ ] Variáveis de ambiente OK?
- [ ] FRONTEND_URL = URL de produção?
- [ ] SMTP_FROM = email válido?
- [ ] Tentou enviar email real e recebeu?

**Se todas as caixas checked → Pronto para produção! 🚀**

---

## 📝 Logs e Debugging

### Ver Logs de Email

```bash
# Durante desenvolvimento
npm run dev

# Procure por:
# ✅ Email de verificação enviado via Resend para usuario@email.com
# ✅ Email enviado via SMTP para usuario@email.com
# 📧 [SIMULADO] Email enviado para usuario@email.com
# ❌ Erro ao enviar email de verificação: ...
```

### Ver Tokens no Banco

```bash
# Conectar ao banco
docker compose exec postgres psql -U postgres -d estoque

# Ver tokens pendentes
SELECT id, email, emailVerificationToken, emailVerificationExpires
FROM "Usuario"
WHERE "emailVerificationToken" IS NOT NULL;
```

---

## 🎯 Resumo de Uso Rápido

```bash
# 1. Desenvolvimento: Menu interativo
node test-email-local.js

# 2. Validação antes de commit
node test-email-completo.js

# 3. Verificação rápida
node test-email-local.js --auto

# 4. Teste específico (em breve)
node test-email-cli.js verify usuario@email.com
```

**Todos os testes rodando = Email system OK! ✅**

---

**Última atualização:** 26 de fevereiro de 2026  
**Status:** Production Ready 🚀
