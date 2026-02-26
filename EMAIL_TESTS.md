# 📧 Testes de Email - Guia Rápido

## 3 Scripts de Teste Disponíveis

### 1. **test-email-local.js** - Menu Interativo Completo

```bash
# Modo interativo
node test-email-local.js

# Modo automático (executa todos os testes)
node test-email-local.js --auto
```

**Melhor para:** Aprender sobre o sistema, explorar opções interativamente

### 2. **test-email-completo.js** - Suite Automática Completa

```bash
node test-email-completo.js
```

**Melhor para:** Validação rápida antes de commit/deploy (8 testes em sequência)

### 3. **test-email-cli.js** - Testes Rápidos via CLI

```bash
# Testar email de verificação
node test-email-cli.js verify usuario@email.com

# Testar reset de senha
node test-email-cli.js reset usuario@email.com

# Testar upgrade
node test-email-cli.js upgrade empresa@email.com

# Gerar tokens
node test-email-cli.js token 5

# Ver configuração
node test-email-cli.js config

# Ver ajuda
node test-email-cli.js help
```

**Melhor para:** Testes rápidos durante desenvolvimento

---

## 🚀 Quick Start

### Para Desenvolvedores

```bash
# 1. Ver configuração atual
node test-email-cli.js config

# 2. Testar email específico
node test-email-cli.js verify seu_email@empresa.com

# 3. Gerar alguns tokens para análise
node test-email-cli.js token 3
```

### Para Validação Antes de Deploy

```bash
# 1. Suite completa (8 testes)
node test-email-completo.js

# 2. Verifique que todos passaram ✅
# 3. Se tudo OK → Safe to deploy!
```

### Para Aprendizado

```bash
# 1. Menu interativo
node test-email-local.js

# 2. Escolha opções específicas
# 3. Entenda cada fluxo
```

---

## 📋 Comparação dos Scripts

| Feature                 | local       | completo | cli         |
| ----------------------- | ----------- | -------- | ----------- |
| **Menu Interativo**     | ✅          | ❌       | ❌          |
| **Automático Completo** | ✅ (--auto) | ✅       | ❌          |
| **Testes Específicos**  | ✅          | ✅       | ✅ (rápido) |
| **Verificação Config**  | ✅          | ✅       | ✅          |
| **Geração Tokens**      | ✅          | ✅       | ✅          |
| **Teste Verificação**   | ✅          | ✅       | ✅          |
| **Teste Reset Senha**   | ✅          | ✅       | ✅          |
| **Teste Upgrade**       | ✅          | ✅       | ✅          |
| **Rate Limiting**       | ✅          | ✅       | ❌          |
| **Bulk Simulation**     | ✅          | ✅       | ❌          |
| **Provider Fallback**   | ✅          | ✅       | ❌          |
| **Tempo Execução**      | ~150s       | ~6s      | ~1s         |

---

## 🔍 O Que Cada Teste Valida

### Email de Verificação

- ✅ Token é gerado corretamente (64 hex chars)
- ✅ Token é hasheado com SHA256
- ✅ Link de verificação está correto
- ✅ Expiração configurada (1 hora)
- ✅ Email é formatado corretamente

### Email de Reset de Senha

- ✅ Token único é gerado
- ✅ Expiração curta (15 minutos)
- ✅ Link está correto
- ✅ Segurança: expiração rápida

### Email de Upgrade PRO

- ✅ Destinatário correto
- ✅ Recursos listados corretamente
- ✅ Formatação de email OK

### Rate Limiting

- ✅ Login: 5 tentativas/15min
- ✅ Forgot Password: 3 tentativas/60min
- ✅ Verify Email: sem limite

### Tokens

- ✅ Raw token: enviado por email
- ✅ Hashed token: armazenado no BD
- ✅ Tamanho correto (32 bytes)
- ✅ Formato correto (hex)

### Provider Fallback

- ✅ Resend detectado (se configurado)
- ✅ SMTP detectado (se configurado)
- ✅ Fallback funciona (Simulado como último)

---

## 💡 Exemplos de Uso Real

### Desenvolvimento Contínuo

```bash
# Durante o development, validação rápida
node test-email-cli.js verify seu_email@empresa.com
```

### Antes de Fazer Commit

```bash
# Certificar que email funciona
node test-email-cli.js config
node test-email-completo.js
```

### Antes de Deploy

```bash
# Suite completa
node test-email-completo.js

# Se tudo passou, seguro fazer deploy!
```

### Investigando Issues

```bash
# Verificar configuração atual
node test-email-cli.js config

# Testar tipo de email específico
node test-email-cli.js verify usuario@empresa.com

# Gerar tokens para debug
node test-email-cli.js token 10
```

### Entendendo o Sistema

```bash
# Ver todas as opções
node test-email-local.js

# Explorar interativamente
# Escolha cada opção para entender fluxo
```

---

## 🔧 Configurando Provedores

### Resend (Recomendado)

1. Acesse: https://resend.com
2. Obtenha API key
3. Adicione ao `.env`:

```env
RESEND_API_KEY=re_sua_chave_aqui
```

4. Reinicie backend
5. Teste: `node test-email-cli.js config` (deve mostrar ✓ Configurado)

### SMTP (Gmail)

1. Habilite "Less secure apps" ou "Google App Password"
2. Adicione ao `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_app_password
```

3. Reinicie backend
4. Teste: `node test-email-cli.js config`

---

## 📊 Output Esperado - CLI

### `node test-email-cli.js config`

```
⚙️ Configuração de Email

NODE_ENV:                 development
FRONTEND_URL:             http://localhost:5173
SMTP_FROM:                noreply@mail.coderonin.com.br

Resend API:               ✓ Configurado
SMTP Host:                ✗ Não configurado

ℹ️  Provedor ativo: Resend
```

### `node test-email-cli.js verify usuario@email.com`

```
📧 Email de Verificação: usuario@email.com

Destinatário:             usuario@email.com
Assunto:                  ✉️ Verifique seu Email - BarStock

Token Gerado:
Raw:                      990142d549d252366...
Hashed BD:                2f96041cfbdac1c21...

Link de Verificação:
URL:                      http://localhost:5173/verify-email?token=990142...

Detalhes:
Válido por:               1 hora
Ação:                     Ativa a conta do usuário
Segurança:                Token armazenado com hash SHA256

✅ Email pronto para envio!
```

### `node test-email-completo.js`

```
🚀 Testes de Email - BarStock

[SECTION 1] 🔍 Verificando Configuração
[SECTION 2] 📧 Teste: Email de Verificação
[SECTION 3] 📧 Teste: Email de Reset de Senha
[SECTION 4] 📧 Teste: Email de Upgrade PRO
[SECTION 5] ⏱️ Teste: Rate Limiting
[SECTION 6] 🔐 Teste: Geração de Tokens
[SECTION 7] 📬 Teste: Simulação de Envio em Massa
[SECTION 8] 🔄 Teste: Fallback de Provedores

✅ Todos os Testes Completados!
✅ Pronto para produção! 🚀
```

---

## ⚠️ Troubleshooting

### "Nenhum provedor configurado"

```bash
# 1. Abra .env
# 2. Adicione RESEND_API_KEY ou SMTP_HOST
# 3. Salve
# 4. Reinicie: npm run dev
# 5. Teste: node test-email-cli.js config
```

### "Email inválido"

```bash
# Certifique-se do formato
node test-email-cli.js verify usuario@dominio.com
```

### SMTP não conecta

```bash
# Verificar configuração
node test-email-cli.js config

# Verificar:
# - SMTP_HOST correto?
# - SMTP_PORT correto (587 ou 465)?
# - Usuário/senha corretos?
# - Firewall permite porta?
```

---

## 📚 Documentação Completa

Para guia detalhado com todas as opções e fluxos, veja:
[EMAIL_TESTING_GUIDE.md](./EMAIL_TESTING_GUIDE.md)

---

## ✨ Próximos Passos

**IMEDIATO:**

```bash
# 1. Testar configuração atual
node test-email-cli.js config

# 2. Se aparecer "Simulado" → Adicione provedor
# 3. Se tudo OK → Pronto!
```

**PARA DEPLOY:**

```bash
# 1. Suite completa de testes
node test-email-completo.js

# 2. Verifique todos os checkmarks ✅
# 3. Seguro fazer deploy!
```

---

## 🎯 Commands Rápidos

```bash
# Ver help
node test-email-cli.js help

# Ver config
node test-email-cli.js config

# Testar email de verificação
node test-email-cli.js verify usuario@email.com

# Testar reset de senha
node test-email-cli.js reset usuario@email.com

# Testar upgrade
node test-email-cli.js upgrade empresa@email.com

# Gerar tokens
node test-email-cli.js token 5

# Menu completo
node test-email-local.js

# Suite completa
node test-email-completo.js

# Suite completa automática
node test-email-local.js --auto
```

---

**Status:** ✅ Production Ready  
**Última atualização:** 26 de fevereiro de 2026
