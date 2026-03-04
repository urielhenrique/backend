# Migração de Segurança: localStorage → httpOnly Cookies + CSRF

## 📋 Resumo

Implementação completa de autenticação segura com **httpOnly cookies** e **proteção CSRF** para produção SaaS.

### ❌ Vulnerabilidades Corrigidas

1. **XSS Exposure**: JWT armazenado em `localStorage` era acessível via JavaScript malicioso
2. **Token Visibility**: Tokens visíveis no DevTools e pode ser roubados facilmente
3. **CSRF Attacks**: Sem proteção contra Cross-Site Request Forgery

### ✅ Segurança Implementada

1. **httpOnly Cookies**: Tokens inacessíveis via JavaScript
2. **Secure Flag**: Cookies transmitidos apenas via HTTPS em produção
3. **SameSite Strict**: Proteção contra CSRF de terceiros
4. **CSRF Token**: Token de proteção adicional para operações POST/PUT/DELETE

---

## 🔧 Mudanças no Backend

### 1. **src/shared/utils/cookie.config.ts** ✨ NOVO

```typescript
// Configuração centralizada de cookies seguros
export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // ✅ Protege contra XSS
  secure: IS_PRODUCTION, // ✅ HTTPS em produção
  sameSite: "strict", // ✅ Protege contra CSRF
  maxAge: 3600000, // 1 hora
};

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "strict",
  maxAge: 604800000, // 7 dias
};
```

### 2. **src/modules/auth/auth.controller.ts** 🔄 MODIFICADO

**ANTES:**

```typescript
return res.json({
  token, // ❌ Token exposto em JSON
  refreshToken, // ❌ RefreshToken exposto
  user,
});
```

**DEPOIS:**

```typescript
// ✅ Tokens armazenados em httpOnly cookies
this.setAuthCookies(res, token, refreshToken);
return res.json({ user }); // Apenas dados do usuário
```

**Novos métodos:**

- `setAuthCookies(res, token, refreshToken)` - Define cookies seguros
- `clearAuthCookies(res)` - Limpa cookies no logout
- `getCsrfToken(req, res)` - Retorna token CSRF para o cliente
- `logout(req, res)` - Endpoint de logout que limpa cookies

### 3. **src/modules/auth/auth.routes.ts** 🔄 MODIFICADO

```typescript
// ✅ Novos endpoints de segurança
router.get("/csrf-token", authController.getCsrfToken.bind(authController));
router.post(
  "/logout",
  authMiddleware,
  authController.logout.bind(authController),
);
```

### 4. **src/shared/middlewares/auth.middleware.ts** 🔄 MODIFICADO

**ANTES:**

```typescript
const token = req.headers.authorization?.replace("Bearer ", "");
```

**DEPOIS:**

```typescript
// ✅ Lê token de cookies httpOnly (prioridade)
let token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

// Fallback temporário para compatibilidade durante migração
if (!token && req.headers.authorization) {
  token = req.headers.authorization.replace("Bearer ", "");
}
```

### 5. **src/server.ts** 🔄 MODIFICADO

```typescript
// ✅ Cookie parser
app.use(cookieParser());

// ✅ CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
  },
});

// Aplica CSRF seletivamente
app.use((req, res, next) => {
  // Pula métodos seguros e endpoints específicos
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.path === "/health" ||
    req.path === "/billing/webhook"
  ) {
    return next();
  }
  csrfProtection(req, res, next);
});

// ✅ CORS com header CSRF
const whitelist = [FRONTEND_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"], // ✅ Adiciona CSRF
  }),
);
```

### 6. **src/types/express.d.ts** 🔄 MODIFICADO

```typescript
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer; // Para webhooks Stripe
      csrfToken?: () => string; // ✅ Método CSRF do middleware
    }
  }
}
```

---

## 🎨 Mudanças no Frontend

### 1. **src/api/api.ts** 🔄 MODIFICADO

**ANTES:**

```typescript
this.client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ❌ Lê token de localStorage
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ Remove token do localStorage em erro 401
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);
```

**DEPOIS:**

```typescript
class ApiClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null; // ✅ CSRF em memória

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { "Content-Type": "application/json" },
      withCredentials: true, // ✅ Envia cookies automaticamente
    });

    // ✅ Adiciona CSRF token para métodos POST/PUT/DELETE
    this.client.interceptors.request.use((config) => {
      if (
        this.csrfToken &&
        ["post", "put", "delete", "patch"].includes(
          config.method?.toLowerCase() || "",
        )
      ) {
        config.headers["X-CSRF-Token"] = this.csrfToken;
      }

      // Transformações de snake_case/camelCase mantidas...
      return config;
    });

    // ✅ Redireciona para login em 401 (não usa mais localStorage)
    this.client.interceptors.response.use(
      (response) => {
        if (response?.data) {
          response.data = transformKeysDeep(response.data, toCamelCase);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          window.location.href = "/login"; // ✅ Sem localStorage
        }
        return Promise.reject(error);
      },
    );
  }

  // ✅ Método para buscar CSRF token
  async fetchCsrfToken(): Promise<void> {
    try {
      const response = await this.client.get<{ csrfToken: string }>(
        "/auth/csrf-token",
      );
      this.csrfToken = response.data.csrfToken;
    } catch (error) {
      console.error("Erro ao buscar CSRF token:", error);
    }
  }
}
```

### 2. **src/services/auth.service.js** 🔄 MODIFICADO

**ANTES:**

```javascript
async login(email, password) {
  const response = await apiClient.post("/auth/login", { email, password });

  // ❌ Armazena tokens em localStorage
  if (response.token) {
    localStorage.setItem("auth_token", response.token);
    localStorage.setItem("refresh_token", response.refreshToken);
  }

  return response;
}

logout() {
  // ❌ Remove apenas de localStorage
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}
```

**DEPOIS:**

```javascript
async login(email, password) {
  const response = await apiClient.post("/auth/login", { email, password });

  // ✅ Tokens já foram definidos em cookies pelo backend
  // Armazenar apenas dados do usuário
  if (response.user) {
    localStorage.setItem("user", JSON.stringify(response.user));
  }

  return response;
}

async logout() {
  try {
    // ✅ Chama endpoint que limpa cookies no servidor
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Erro ao fazer logout no servidor:", error);
  } finally {
    localStorage.removeItem("user");
  }
}

// ✅ isAuthenticated agora verifica apenas user, não token
isAuthenticated() {
  return !!this.getStoredUser();
}
```

**Mudanças em todos os métodos:**

- `login()` - Remove `localStorage.setItem` para tokens ✅
- `loginWithGoogle()` - Remove `localStorage.setItem` para tokens ✅
- `register()` - Remove `localStorage.setItem` para tokens ✅
- `logout()` - Chama endpoint `/auth/logout` ✅

### 3. **src/App.jsx** 🔄 MODIFICADO

```javascript
import apiClient from "@/api/api";
import { useEffect } from "react";

function App() {
  // ✅ Buscar CSRF token no carregamento da aplicação
  useEffect(() => {
    apiClient.fetchCsrfToken();
  }, []);

  return <AuthProvider>{/* ... resto do código */}</AuthProvider>;
}
```

---

## 🔄 Fluxo de Autenticação Novo

### 1. **Registro/Login**

```
Frontend                          Backend
   |                                 |
   |--POST /auth/login-------------->|
   |   { email, password }           |
   |                                 |
   |<--------------------------------|
   |   Set-Cookie: access_token=...  | ✅ httpOnly, secure, sameSite
   |   Set-Cookie: refresh_token=... | ✅ httpOnly, secure, sameSite
   |   { user: {...} }               |
   |                                 |
localStorage.setItem("user", user)  |
```

### 2. **Requisição Autenticada**

```
Frontend                          Backend
   |                                 |
   |--GET /api/protected------------>|
   |   Cookie: access_token=...      | ✅ Enviado automaticamente
   |   X-CSRF-Token: abc123          | ✅ Proteção CSRF
   |                                 |
   |                   authMiddleware|----> Lê req.cookies.access_token
   |                   jwt.verify()  |----> Valida token
   |                                 |
   |<--------------------------------|
   |   { data: [...] }               |
```

### 3. **Logout**

```
Frontend                          Backend
   |                                 |
   |--POST /auth/logout------------->|
   |   Cookie: access_token=...      |
   |   X-CSRF-Token: abc123          |
   |                                 |
   |<--------------------------------|
   |   Set-Cookie: access_token=;    | ✅ Limpa cookies
   |   Set-Cookie: refresh_token=;   | ✅ Limpa cookies
   |   expires=Thu, 01 Jan 1970      |
   |                                 |
localStorage.removeItem("user")     |
window.location.href = "/login"     |
```

---

## 🧪 Como Testar

### 1. **Teste de Cookies httpOnly**

```bash
# Backend
cd backend
npm run dev

# Frontend
cd bar-controle-web
npm run dev
```

1. Abrir DevTools → Application → Cookies
2. Fazer login
3. Verificar cookies `access_token` e `refresh_token` com flags:
   - ✅ HttpOnly: Sim
   - ✅ Secure: Sim (em produção)
   - ✅ SameSite: Strict

### 2. **Teste de CSRF Protection**

```javascript
// No console do DevTools, tentar fazer request sem token
fetch("http://localhost:3001/api/produtos", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome: "Teste" }),
});

// ❌ Deve retornar erro 403 (CSRF token ausente)
```

### 3. **Teste de Google OAuth**

1. Fazer login com Google
2. Verificar que cookies foram definidos
3. Navegar para rotas protegidas
4. Verificar que autenticação funciona

### 4. **Teste de Logout**

1. Fazer login
2. Verificar cookies criados
3. Clicar em "Sair"
4. Verificar cookies removidos no DevTools
5. Tentar acessar rota protegida (deve redirecionar para login)

---

## 📦 Variáveis de Ambiente Necessárias

### Backend (.env)

```bash
NODE_ENV=production           # ✅ Ativa flag 'secure' nos cookies
FRONTEND_URL=https://seu-dominio.com  # ✅ CORS whitelist
JWT_SECRET=seu-jwt-secret-forte
DATABASE_URL=postgres://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (.env)

```bash
VITE_API_URL=https://api.seu-dominio.com
VITE_GOOGLE_CLIENT_ID=...
```

---

## 🚀 Deploy no Coolify

### Checklist de Configuração

1. **Environment Variables no Coolify:**

   ```bash
   NODE_ENV=production
   FRONTEND_URL=https://seu-dominio.com
   JWT_SECRET=<gerar-token-forte-256-bits>
   DATABASE_URL=<url-postgres-coolify>
   GOOGLE_CLIENT_ID=<seu-client-id>
   GOOGLE_CLIENT_SECRET=<seu-client-secret>
   ```

2. **HTTPS Obrigatório:**
   - Coolify já fornece SSL automático via Let's Encrypt
   - Verificar que `secure: true` está ativo em produção (NODE_ENV=production)

3. **CORS Configuration:**
   - Garantir que FRONTEND_URL no backend corresponde EXATAMENTE ao domínio frontend
   - Formato: `https://seu-dominio.com` (sem barra no final)

4. **SameSite Strict:**
   - Frontend e Backend devem estar no mesmo domínio raiz ou subdomínios
   - Exemplo válido:
     - Frontend: `https://app.seudominio.com`
     - Backend: `https://api.seudominio.com`
   - Exemplo INVÁLIDO (SameSite vai bloquear):
     - Frontend: `https://seudominio.com`
     - Backend: `https://outro-dominio.com`

5. **Teste Local antes de Deploy:**

   ```bash
   # Backend
   NODE_ENV=development npm run dev

   # Frontend
   npm run dev

   # Testar:
   - Login funciona
   - Cookies aparecem no DevTools
   - Requisições autenticadas funcionam
   - CSRF bloqueando requests sem token
   - Logout limpa cookies
   ```

---

## 🔒 Benefícios de Segurança

| Vulnerabilidade           | Antes                                               | Depois                                            |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| **XSS Token Theft**       | ❌ Token em localStorage acessível por JS malicioso | ✅ httpOnly cookies inacessíveis via JavaScript   |
| **CSRF Attacks**          | ❌ Sem proteção                                     | ✅ CSRF token obrigatório em POST/PUT/DELETE      |
| **Token Visibility**      | ❌ Visível no DevTools, Network tab                 | ✅ Cookies httpOnly não aparecem em resposta JSON |
| **Man-in-the-Middle**     | ❌ HTTP permitido                                   | ✅ Secure flag força HTTPS em produção            |
| **Cross-Site Token Leak** | ❌ Token pode ser enviado para qualquer domínio     | ✅ SameSite Strict limita cookies ao domínio      |

---

## ⚠️ Notas Importantes

1. **Compatibilidade durante Migração:**
   - Backend mantém suporte temporário para `Authorization: Bearer` header
   - Remover após confirmar que frontend está 100% migrado

2. **Refresh Token:**
   - Implementar endpoint `/auth/refresh` para renovar `access_token`
   - Usar `refresh_token` cookie (já configurado)

3. **Webhook do Stripe:**
   - CSRF está DESABILITADO para `/billing/webhook`
   - Stripe usa assinatura própria para validação

4. **Health Check:**
   - CSRF está DESABILITADO para `/health`
   - Permite monitoramento sem autenticação

---

## 📚 Referências

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Set-Cookie httpOnly](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#httponly)
- [Express CSRF Protection](https://github.com/expressjs/csurf)

---

## ✅ Status da Implementação

- [x] Backend: Cookie configuration
- [x] Backend: Auth controller com cookies
- [x] Backend: Auth middleware lê de cookies
- [x] Backend: CSRF protection configurado
- [x] Backend: Endpoints de logout e CSRF token
- [x] Backend: TypeScript types extendidos
- [x] Backend: Compilação bem-sucedida
- [x] Frontend: Axios com withCredentials
- [x] Frontend: Remoção de localStorage para tokens
- [x] Frontend: CSRF token fetch no App.jsx
- [x] Frontend: Auth service migrado
- [ ] Testes de integração completos
- [ ] Deploy em staging/produção
- [ ] Validação de Google OAuth com cookies
- [ ] Documentação de usuário final

---

**Data de Implementação:** 2025
**Desenvolvedor:** Senior Security Engineer
**Status:** ✅ Implementação Completa - Pronto para Testes
