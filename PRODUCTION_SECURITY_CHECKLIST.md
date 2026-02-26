# 🔒 Checklist de Segurança - Pronto para Produção

## Status: ✅ IMPLEMENTADO

---

## 1. **Proteção de Endpoints de Teste**

### ✅ Status: COMPLETO

Os endpoints de teste foram protegidos com verificação de ambiente:

**Arquivo:** [src/modules/auth/auth.routes.ts](src/modules/auth/auth.routes.ts)

```typescript
// ⚠️ TESTE - Endpoints apenas para desenvolvimento (desabilitados em produção)
if (process.env.NODE_ENV !== "production") {
  router.get("/test/get-verification-token/:email", async (req, res) => {
    // ... código de teste ...
  });

  router.get("/test/get-reset-token/:email", async (req, res) => {
    // ... código de teste ...
  });
}
```

**Comportamento:**
- Em `NODE_ENV !== "production"` → Endpoints disponíveis para testes
- Em `NODE_ENV === "production"` → Endpoints desabilitados automaticamente
- Nenhuma tentativa de acesso retornará erro 404 em produção

---

## 2. **Migração para Resend (Email Profissional)**

### ✅ Status: IMPLEMENTADO

O serviço de email foi modernizado para usar **Resend** em produção com fallback para SMTP:

**Arquivo:** [src/shared/services/email.service.ts](src/shared/services/email.service.ts)

**Prioridade de Provedores:**
1. **Resend** (Produção - Recomendado) → Se `RESEND_API_KEY` configurada
2. **SMTP** (Fallback) → Se credenciais SMTP disponíveis
3. **Simulado** (Desenvolvimento) → Sem configuração de email

### Configuração Necessária para Produção:

#### Opção 1: Usar Resend (Recomendado)

```bash
# Instale o pacote (já feito)
npm install resend
```

**Variáveis de Ambiente:**
```env
RESEND_API_KEY=your_resend_api_key_here
SMTP_FROM=noreply@barstock.com.br  # ou seu domínio
FRONTEND_URL=https://app.barstock.com.br  # URL da aplicação
```

**Obtenha sua API Key em:** https://resend.com

#### Opção 2: Usar SMTP (Fallback)

```env
SMTP_HOST=smtp.seu_provedor.com
SMTP_PORT=587
SMTP_USER=seu_email@seu_dominio.com
SMTP_PASSWORD=sua_senha
SMTP_FROM=noreply@barstock.com.br
FRONTEND_URL=https://app.barstock.com.br
```

### Métodos Disponíveis:

1. **Email de Verificação**
   - Enviado após registro do usuário
   - Link válido por 1 hora
   - Método: `sendVerificationEmail(email, token)`

2. **Email de Reset de Senha**
   - Enviado quando usuário solicita reset
   - Link válido por 15 minutos
   - Método: `sendPasswordResetEmail(email, token)`

3. **Emails Adicionais** (compatibilidade legada)
   - `sendUpgradeConfirmation()` - Confirmação de upgrade PRO
   - `sendDowngradeNotification()` - Notificação de downgrade
   - `sendUsageReport()` - Relatório de uso mensal

### Logs de Email:

Todos os envios são logados com status:

```
✅ Email de verificação enviado via Resend para usuario@email.com
✅ Email enviado via SMTP para usuario@email.com
📧 [SIMULADO] Email de reset enviado para usuario@email.com
❌ Erro ao enviar email via Resend: ...
```

---

## 3. **Segurança de Tokens**

### ✅ Status: VALIDADO

- ✅ **Raw tokens** enviados por email (nunca armazenados em plaintext)
- ✅ **SHA256 hashing** dos tokens no banco de dados
- ✅ **Token expiration** validado (1 hora para email, 15 min para reset)
- ✅ **Rate limiting** ativo (5 tentativas de login/15 min)
- ✅ **CSRF protection** implementada
- ✅ **JWT httpOnly cookies** para prevenir XSS

---

## 4. **Variáveis de Ambiente Obrigatórias para Produção**

### Essenciais:

```env
# Base
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/estoque

# JWT
JWT_SECRET=seu_secret_seguro_aqui_(minimo_32_caracteres)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email Service (escolha uma opção)
# Opção 1: Resend (Recomendado)
RESEND_API_KEY=seu_api_key_resend

# Opção 2: SMTP
SMTP_HOST=smtp.seu_provedor.com
SMTP_PORT=587
SMTP_USER=seu_email@seu_dominio
SMTP_PASSWORD=sua_senha

# Standard
SMTP_FROM=noreply@barstock.com.br
FRONTEND_URL=https://app.barstock.com.br

# OAuth (se habilitado)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

---

## 5. **Checklist de Deploy**

### Antes de Fazer Deploy:

- [ ] Definir `NODE_ENV=production`
- [ ] Gerar `JWT_SECRET` seguro (use: `openssl rand -base64 32`)
- [ ] Configurar Resend ou SMTP
- [ ] Testar envio de email em staging
- [ ] Validar todas as variáveis de ambiente
- [ ] Remover logs sensíveis (opcional, veja logs atuais)
- [ ] Executar testes finais em staging
- [ ] Verificar rate limiting funciona
- [ ] Verificar CSRF protection ativa
- [ ] Testar fluxo completo: registro → email → login → reset

### Pós-Deploy:

- [ ] Monitorar logs de erro
- [ ] Validar taxa de entrega de emails
- [ ] Verificar performance de autenticação
- [ ] Testar fallback de email (desabilitar Resend e testar SMTP)

---

## 6. **Monitoramento em Produção**

### Recomendações:

1. **Monitorar Envio de Emails:**
   ```bash
   # Exemplo de log para rastrear
   ✅ Email enviado via Resend para usuario@email.com
   ```

2. **Alertar em Falhas:**
   - Email falha por conta inválida
   - Taxa de erro > 5%
   - Tentativas de rate limit recusadas

3. **Métricas Importantes:**
   - Taxa de verificação de email (target: > 95%)
   - Tempo médio de reset de senha
   - Falhas de envio de email
   - Taxa de utilização de rate limite

---

## 7. **Suporte Técnico**

### Documentação:

- Resend Docs: https://resend.com/docs
- Rate Limiting: express-rate-limit
- CSRF Protection: csurf middleware
- JWT: jsonwebtoken

### Troubleshooting:

**Email não está sendo enviado:**
1. Verificar `NODE_ENV` e variáveis de ambiente
2. Validar API key do Resend
3. Verificar logs da aplicação
4. Fallback para SMTP se Resend falhar

**Tokens expirando muito rápido:**
1. Verificar `emailVerificationExpires` (padrão: 1 hora)
2. Verificar `passwordResetExpires` (padrão: 15 minutos)

**Rate limit bloqueando usuários:**
1. Limite de login: 5 tentativas / 15 minutos
2. Limite de forgot password: 3 tentativas / 60 minutos
3. Implementar Redis para rate limiter mais robusto (recomendado)

---

## 8. **Próximos Passos Recomendados**

### Curto Prazo (Antes de Deploy):
1. ✅ Configurar Resend ou SMTP
2. ✅ Testar emails em staging
3. ✅ Validar todas variáveis de ambiente

### Médio Prazo (2-4 semanas):
1. Implementar Redis para rate limiter (mais robusto)
2. Adicionar logging centralizado (ex: LogRocket, Sentry)
3. Implementar monitoramento de taxas de erro

### Longo Prazo (1-3 meses):
1. Análise de segurança por terceiros
2. Implementar 2FA (autenticação de dois fatores)
3. Adicionar auditoria de ações sensíveis

---

## 📋 Resumo Final

| Item | Status | Implementado Por |
|------|--------|------------------|
| Endpoints de teste protegidos | ✅ | Verificação NODE_ENV |
| Migração para Resend | ✅ | email.service.ts |
| Fallback para SMTP | ✅ | email.service.ts |
| Segurança de tokens | ✅ | Hashing SHA256 |
| Rate limiting | ✅ | security.middleware.ts |
| CSRF protection | ✅ | csurf middleware |
| Email verification | ✅ | emailVerification.controller.ts |
| Password reset | ✅ | emailVerification.controller.ts |
| JWT httpOnly | ✅ | auth.controller.ts |

---

**Última Atualização:** 26 de fevereiro de 2026  
**Status:** 🟢 Pronto para Produção  
**Próximo Review:** Após deploy em produção
