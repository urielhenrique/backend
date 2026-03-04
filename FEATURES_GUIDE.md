# 🚀 Guia de Novas Features - Bar Stock SaaS

Data: 20 de fevereiro de 2026

## ✅ O que foi implementado

### 1️⃣ **Melhorias de Segurança**

#### Rate Limiting

- **Login**: 5 tentativas a cada 15 minutos
- **API Geral**: 100 requisições a cada 15 minutos
- Retorna mensagem clara quando limite é atingido

#### Security Headers

- `X-Frame-Options: DENY` - Previne clickjacking
- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `X-XSS-Protection` - Proteção contra XSS
- `Content-Security-Policy` - Política de segurança de conteúdo
- `Strict-Transport-Security` - Força HTTPS

#### Backend

```bash
POST /auth/login     # Com rate limiting
POST /auth/register  # Criar nova conta
GET  /auth/me        # Dados do usuário autenticado
```

---

### 2️⃣ **OAuth Google Authentication**

#### Como configurar (Produção)

1. **Criar App no Google Cloud Console**
   - Ir para: https://console.cloud.google.com/
   - Criar novo projeto
   - Ativar "Google+ API"
   - Criar credenciais OAuth 2.0
   - Adicionar URIs autorizados:
     ```
     https://api.barstock.coderonin.com.br
     https://barstock.coderonin.com.br
     http://localhost:3001
     http://localhost:5173
     ```

2. **Backend - Adicionar variáveis de ambiente**

   ```bash
   GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
   ```

3. **Frontend - Implementar botão de Google**
   ```jsx
   <GoogleLogin
     onSuccess={(credentialResponse) => {
       // Enviar para backend
       apiClient.post("/auth/google", {
         idToken: credentialResponse.credential,
       });
     }}
   />
   ```

#### Endpoint API

```
POST /auth/google
Body: {
  "idToken": "google-token-aqui"
}

Response: {
  "token": "jwt-token",
  "user": { ... }
}
```

**Comportamento:**

- Se email já existe → Login automático
- Se email é novo → Cria novo usuário e estabelecimento

---

### 3️⃣ **Nova Página de Login (LoginV2)**

#### Acesso

- URL: `/login-v2`
- Ou alterne o link de redirecionamento em `App.jsx`

#### Features

✅ Design moderno e amigável
✅ Modo escuro (Dark Mode)
✅ Formulário de Login
✅ Formulário de Signup (Criar Conta)
✅ Botão Google OAuth
✅ Indicadores de loading
✅ Validação em tempo real
✅ Temas com Tailwind CSS

#### Campos

- **Login**: Email + Senha
- **Signup**: Nome Estabelecimento + Nome + Email + Senha

---

### 4️⃣ **Admin Dashboard**

#### Acesso

```
URL: /admin
Requer: Role "ADMIN"
```

#### Features

**📊 Estatísticas (KPI Cards)**

- Total de Estabelecimentos
- Estabelecimentos em Plano FREE
- Estabelecimentos em Plano PRO
- Total de Usuários

**📈 Gráfico de Distribuição**

- Visualização comparativa FREE vs PRO
- Usando biblioteca Recharts

**🔍 Filtros de Usuários**

- Todos: Lista completa
- Plano FREE: Apenas usuários no plano gratuito
- Plano PRO: Apenas usuários premium
- Online: Usuários ativos nos últimos 30 minutos

**📋 Tabela de Usuários**

- Estabelecimento
- Plano (com badge colorida)
- Quantidade de usuários
- Status (Ativo/Inativo)
- Data de criação

**💾 Exportar CSV**

- Clique em "Export CSV" para baixar relatório

#### Endpoints API

```bash
# Estatísticas gerais
GET /admin/dashboard
Response: {
  "totalEstabelecimentos": 25,
  "freeEstabelecimentos": 18,
  "proEstabelecimentos": 7,
  "totalUsuarios": 45
}

# Lista todos os usuários
GET /admin/users
Response: [
  {
    "estabelecimentoId": "...",
    "estabelecimentoNome": "Bar do João",
    "plano": "PRO",
    "ativo": true,
    "criadoEm": "2025-02-20T...",
    "usuarios": [...]
  }
]

# Filtrar por plano
GET /admin/users/plan/free
GET /admin/users/plan/pro

# Usuários online
GET /admin/users/online
Response: {
  "usuariosOnline": 5,
  "usuarios": [...]
}

# Desativar estabelecimento
DELETE /admin/estabelecimento/:id
```

---

## 📝 Exemplo de Uso

### 1. Login com Email/Senha

```javascript
// Frontend
const login = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("auth_token", response.token);
  return response.user;
};
```

### 2. Login com Google

```javascript
// Frontend
const handleGoogleSuccess = async (credentialResponse) => {
  const response = await apiClient.post("/auth/google", {
    idToken: credentialResponse.credential,
  });

  localStorage.setItem("auth_token", response.token);
  // Redirecionar para home
};
```

### 3. Acessar Admin Dashboard

```javascript
// Apenas usuários com role ADMIN conseguem acessar
navigate("/admin");

// Se não for admin, será redirecionado
```

---

## 🔐 Segurança - Checklist

- ✅ Senhas hasheadas com bcrypt
- ✅ JWT para autenticação
- ✅ Rate limiting em login
- ✅ Security headers na resposta
- ✅ CORS configurado
- ✅ Admin-only routes protegidas
- ✅ HTTPS obrigatório em produção
- ✅ Token expira em 7 dias

**Importante:**

- Sempre use HTTPS em produção
- Mantenha JWT_SECRET seguro
- Nunca exponha JWT no localStorage (considere httpOnly cookies)

---

## 📊 Banco de Dados

### Schema atualizado

```prisma
model Estabelecimento {
  id     String @id @default(uuid())
  nome   String
  plano  Plano  @default(FREE)  # FREE ou PRO
  ativo  Boolean @default(true)
  # ... outros campos
}

model Usuario {
  id    String @id @default(uuid())
  email String @unique
  # ... outros campos
  role  Role   @default(FUNCIONARIO)  # ADMIN ou FUNCIONARIO
}
```

---

## 🚀 Próximas Melhorias (Sugestões)

1. **Email Verification**
   - Enviar email de confirmação no signup
   - Verificar email antes de ativar conta

2. **2FA (Two-Factor Authentication)**
   - Adicionar autenticação de dois fatores
   - Usar Google Authenticator ou SMS

3. **Sessions Management**
   - Rastrear sessões ativas dos usuários
   - Logout remoto

4. **Audit Logs**
   - Registrar ações importantes (login, criação de dados, etc)
   - Painel de auditoria

5. **Payment Integration**
   - Stripe/PayPal para plano PRO
   - Webhooks para mudanças de plano

6. **Advanced Admin Features**
   - Refund/Cancelamento de assinatura
   - Estatísticas detalhadas
   - Gráficos de crescimento

---

## 📝 Variáveis de Ambiente Necessárias

### Backend (.env)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=sua-chave-secreta-super-segura
GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
```

### Frontend (.env.production)

```
VITE_API_URL=https://api.barstock.coderonin.com.br
VITE_GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com (opcional)
```

---

## ✅ Testes Recomendados

```bash
# 1. Teste Rate Limiting
for i in {1..10}; do
  curl -X POST https://api.barstock.coderonin.com.br/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
# Deve retornar erro na 6ª requisição

# 2. Teste Admin Dashboard
curl -H "Authorization: Bearer <token>" \
  https://api.barstock.coderonin.com.br/admin/dashboard

# 3. Teste Google OAuth
curl -X POST https://api.barstock.coderonin.com.br/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"google-token-aqui"}'
```

---

## 📞 Suporte & Dúvidas

Se encontrar problemas:

1. Verifique os logs do Coolify
2. Confirme que as variáveis de ambiente estão corretas
3. Teste a API com Postman/Insomnia
4. Verifique os headers de CORS

---

**Última atualização:** 20/02/2026  
**Status:** ✅ Pronto para produção
