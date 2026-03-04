# OAuth Google - Implementação Completa

## ✅ Status: IMPLEMENTADO

### Frontend (bar-controle-web)

- ✅ GoogleOAuthProvider configurado no `main.jsx`
- ✅ GoogleLogin component implementado no `LoginV2.jsx`
- ✅ AuthContext com método `loginWithGoogle`
- ✅ Client ID: `121871816349-h67mqvm49dnlnssngqn4ae07v5e0b59o.apps.googleusercontent.com`
- ✅ Variável de ambiente `.env.local` configurada

### Backend

- ✅ Rota `POST /auth/google` implementada em `auth.routes.ts`
- ✅ Controller `googleLogin` aceita `credential` ou `idToken`
- ✅ Service `googleAuth` valida token com Google API
- ✅ Biblioteca `google-auth-library@9.6.0` instalada
- ✅ Variável de ambiente `GOOGLE_CLIENT_ID` adicionada ao `.env`
- ✅ Auto-criação de usuário e estabelecimento para novos usuários OAuth

---

## 🔄 Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant G as Google
    participant B as Backend
    participant DB as Database

    U->>F: Clica "Continue with Google"
    F->>G: Abre popup de autenticação
    G->>U: Login com conta Google
    U->>G: Autoriza aplicação
    G->>F: Retorna ID Token (JWT)
    F->>B: POST /auth/google {credential: "jwt_token"}
    B->>G: Valida ID Token
    G->>B: Confirma validade + userInfo
    B->>DB: Busca/Cria usuário
    DB->>B: Dados do usuário
    B->>F: {token: "jwt", user: {...}}
    F->>U: Redireciona para dashboard
```

---

## 📡 API Endpoint: POST /auth/google

### Request

```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6I...",
  // OU
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6I..."
}
```

### Response (Sucesso - 200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "name": "João Silva",
    "email": "joao@gmail.com",
    "role": "ADMIN",
    "estabelecimento_id": "uuid-do-estabelecimento",
    "estabelecimento_nome": "João Silva"
  }
}
```

### Response (Erro - 400)

```json
{
  "error": "Token do Google obrigatório"
}
```

### Response (Erro - 400)

```json
{
  "error": "Falha na autenticação Google: Invalid token"
}
```

---

## 🔐 Configuração Google Cloud Console

### 1. Authorized JavaScript origins

```
http://localhost:5173
https://seudominio.com
```

### 2. Authorized redirect URIs

```
http://localhost:5173/login-v2
https://seudominio.com/login-v2
```

---

## 🧪 Como Testar

### 1. Verificar variáveis de ambiente

**Frontend (.env.local):**

```bash
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=121871816349-h67mqvm49dnlnssngqn4ae07v5e0b59o.apps.googleusercontent.com
```

**Backend (.env):**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/estoque
JWT_SECRET=minhasuperchavesegura
GOOGLE_CLIENT_ID=121871816349-h67mqvm49dnlnssngqn4ae07v5e0b59o.apps.googleusercontent.com
```

### 2. Iniciar serviços

**Backend:**

```bash
cd C:\Users\uriel\Project\backend
npm run dev
```

**Frontend:**

```bash
cd C:\Users\uriel\Project\bar-controle-web
npm run dev
```

### 3. Testar login

1. Acesse: `http://localhost:5173/login-v2`
2. Clique no botão "Continue with Google"
3. Selecione uma conta Google
4. Aguarde redirecionamento para o dashboard

---

## 🐛 Troubleshooting

### Erro: "Google OAuth não configurado"

**Causa:** GOOGLE_CLIENT_ID não está definido no backend  
**Solução:** Adicione ao arquivo `.env` do backend

### Erro: "redirect_uri_mismatch"

**Causa:** URI não está configurada no Google Cloud Console  
**Solução:** Adicione as URIs corretas nas configurações do OAuth Client

### Erro: "Invalid token"

**Causa:** Token expirado ou inválido  
**Solução:** Tente fazer login novamente

### Botão Google não aparece

**Causa:** Client ID não configurado no frontend  
**Solução:** Verifique o arquivo `.env.local` e reinicie o dev server

### Erro de CORS

**Causa:** Backend não aceita requisições do frontend  
**Solução:** Verifique configuração de CORS no backend

---

## 📦 Deploy em Produção

### Frontend (Docker)

Adicionar build arg no Dockerfile:

```dockerfile
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
```

Build:

```bash
docker build \
  --build-arg VITE_GOOGLE_CLIENT_ID=121871816349-h67mqvm49dnlnssngqn4ae07v5e0b59o.apps.googleusercontent.com \
  -t bar-controle-web .
```

### Backend (Docker)

Adicionar variável de ambiente:

```yaml
environment:
  - GOOGLE_CLIENT_ID=121871816349-h67mqvm49dnlnssngqn4ae07v5e0b59o.apps.googleusercontent.com
```

---

## 📚 Referências

- [Google Identity - OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [JWT.io Debugger](https://jwt.io/)

---

## ✨ Recursos Implementados

- [x] Login com Google (frontend)
- [x] Validação de token no backend
- [x] Auto-criação de usuário e estabelecimento
- [x] Geração de JWT após autenticação
- [x] Tratamento de erros
- [x] Documentação completa
- [x] Variáveis de ambiente configuradas
- [x] Integração com AuthContext

---

## 🔄 Próximos Passos (Opcional)

- [ ] Adicionar opção de vincular conta Google a usuário existente
- [ ] Implementar refresh token
- [ ] Adicionar foto do usuário do Google ao perfil
- [ ] Permitir múltiplos métodos de login (email + Google)
- [ ] Adicionar analytics de login (quantos usam Google vs email)
