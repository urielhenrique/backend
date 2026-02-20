# 📚 Exemplos de Testes - Sistema de Planos Free vs Pro

Este arquivo demonstra como testar o sistema de limites.
Executar com: `npm run test` ou manual via Postman

---

## ✅ Teste 1: Criar Produto em Plano FREE (Limite 50)

/\*
✅ CENÁRIO 1: Estabelecimento FREE com 49 produtos
POST /produtos
Authorization: Bearer <token>
Body:
{
"nome": "Cerveja Premium Nueva",
"categoria": "Cerveja",
"volume": "600ml",
"estoque_atual": 100,
"estoque_minimo": 5,
"preco_compra": 3.50,
"preco_venda": 8.90,
"fornecedor_id": null
}

Resposta Esperada: ✅ 201 Created
{
"id": "prod-123",
"nome": "Cerveja Premium Nueva",
"categoria": "Cerveja",
"status": "OK",
...
}
\*/

/\*
❌ CENÁRIO 2: Mesmo estabelecimento agora com 50 produtos
POST /produtos
Authorization: Bearer <token>
Body:
{
"nome": "Cerveja Premium Nueva 2",
"categoria": "Cerveja",
...
}

Resposta Esperada: ❌ 400 Bad Request
{
"error": "Limite do plano FREE atingido (50 produtos). Faça upgrade para PRO."
}
\*/

/\*
✅ CENÁRIO 3: Estabelecimento PRO com 50 produtos
POST /produtos
Authorization: Bearer <token-pro>
Body: { ... mesmo body ... }

Resposta Esperada: ✅ 201 Created
Nenhuma validação é feita para PRO
\*/

// ============================================================
// 2️⃣ TESTE: Criar Movimentações (Limite 1000/mês)
// ============================================================

/\*
✅ CENÁRIO 1: Primeira movimentação do mês
POST /movimentacoes
Authorization: Bearer <token>
Body:
{
"produtoId": "prod-123",
"tipo": "Saida",
"quantidade": 10,
"observacao": "Venda ao cliente"
}

Resposta Esperada: ✅ 201 Created
Contador do mês: 1/1000
\*/

/\*
✅ CENÁRIO 2: 999ª movimentação do mês (FREE)
POST /movimentacoes
Body: { ... }

Resposta Esperada: ✅ 201 Created
Contador do mês: 999/1000
\*/

/\*
❌ CENÁRIO 3: 1000ª movimentação do mês (atingiu limite)
POST /movimentacoes
Body: { ... }

Resposta Esperada: ❌ 400 Bad Request
{
"error": "Limite do plano FREE atingido (1000 movimentações por mês). Faça upgrade para PRO."
}
\*/

/\*
✅ CENÁRIO 4: Próximo mês - contador reseta
POST /movimentacoes
Body: { ... }

Resposta Esperada: ✅ 201 Created
Contador do novo mês: 1/1000
(O filtro ve apenas registros com createdAt >= 1º do mês)
\*/

// ============================================================
// 3️⃣ TESTE: Criar Usuários (Limite 1/mês)
// ============================================================

/\*
✅ CENÁRIO 1: Criar segundo usuário (FREE já tem 1)
POST /auth/criar-usuario
Authorization: Bearer <admin-token>
Body:
{
"nome": "João Silva",
"email": "joao@empresa.com",
"senha": "senha123",
"role": "FUNCIONARIO"
}

Resposta Esperada: ❌ 400 Bad Request
{
"error": "Limite do plano FREE atingido (1 usuário). Faça upgrade para PRO."
}
\*/

/\*
✅ CENÁRIO 2: Usuário PRO criando novo usuário
POST /auth/criar-usuario
Authorization: Bearer <admin-pro-token>
Body: { ... }

Resposta Esperada: ✅ 201 Created
{
"id": "user-456",
"nome": "João Silva",
"email": "joao@empresa.com",
"role": "FUNCIONARIO"
}
\*/

// ============================================================
// 4️⃣ TESTE: Verificar Status de Limites
// ============================================================

/\*
GET /plano/status
Authorization: Bearer <token>

Resposta Esperada: ✅ 200 OK
{
"plano": "FREE",
"recursosProdutos": {
"usado": 48,
"limite": 50,
"percentual": 96,
"atencao": true,
"atingido": false
},
"recursosUsuarios": {
"usado": 1,
"limite": 1,
"percentual": 100,
"atencao": true,
"atingido": true
},
"recursosMovimentacao": {
"usado": 892,
"limite": 1000,
"percentual": 89,
"atencao": true,
"atingido": false
},
"limiteAting": ["usuarios"],
"recomendacao": "Você está próximo de atingir os limites do plano FREE.
Considere fazer upgrade para PRO."
}
\*/

/\*
GET /plano/limites
Authorization: Bearer <token>

Resposta Esperada: ✅ 200 OK
{
"plano": "FREE",
"limiteProdutos": 50,
"limiteUsuarios": 1,
"limiteMovimentacaoMensal": 1000
}
\*/

/\*
GET /plano/uso
Authorization: Bearer <token>

Resposta Esperada: ✅ 200 OK
{
"produtos": 48,
"usuarios": 1,
"movimentacaoMes": 892
}
\*/

// ============================================================
// 5️⃣ TESTE: Upgrade para PRO
// ============================================================

/\*
Após upgrade (processamento de pagamento externo):

1. Atualizar estabelecimento:
   PATCH /estabelecimento/plano
   Authorization: Bearer <token>
   Body: { "plano": "PRO" }

2. A partir de agora, PlanoService retorna:
   {
   "plano": "PRO",
   "limiteProdutos": -1, // Ilimitado
   "limiteUsuarios": -1, // Ilimitado
   "limiteMovimentacaoMensal": -1 // Ilimitado
   }

3. checkLimite() retorna imediatamente sem validar:
   if (estabelecimento.plano === "PRO") {
   return; // Sem lançar erro
   }
   \*/

// ============================================================
// 6️⃣ FLUXO COMPLETO: Usuário FREE Atingindo Limite
// ============================================================

/\*

1. Usuário cria estabelecimento (register)
   → Plano: FREE
   → Limite de usuários: 1
   → Limite de produtos: 50
   → Limite de movimentação: 1000/mês

2. Usuário tenta criar um produto #50 ✅
   POST /produtos
   Response: 201 Created

3. Usuário tenta criar um produto #51 ❌
   POST /produtos
   Response: 400 Bad Request
   Error: "Limite do plano FREE atingido (50 produtos)..."

4. Usuário clica "Upgrade para PRO"
   → Sistema processa pagamento
   → PATCH /estabelecimento/plano { "plano": "PRO" }

5. Usuário tenta criar um produto #51 novamente ✅
   POST /produtos
   Response: 201 Created
   (PlanoService retornou sem validar)

6. Dashboard mostra:
   GET /plano/status
   Response:
   {
   "plano": "PRO",
   "limiteProdutos": -1,
   "limiteMovimentacao": -1,
   "limiteUsuarios": -1,
   "recomendacao": null
   }
   \*/

// ============================================================
// 7️⃣ TESTE DE PERFORMANCE
// ============================================================

/\*
count() do Prisma é altamente otimizado:

- Não retorna dados completos
- Usa índices configurados no Schema
- Índices multi-coluna melhoram performance:
  - @@index([estabelecimentoId])
  - @@index([estabelecimentoId, createdAt])
  - @@index([estabelecimentoId, data])

Tempo esperado:

- checkLimite(): ~5-10ms com índices corretos
- getUso(): ~15-30ms (3 queries paralelas)
- getStatus(): ~30-50ms (inclua formatação)
  \*/

// ============================================================
// 8️⃣ TESTE DE ISOLAMENTO MULTI-TENANT
// ============================================================

/\*
Importante: Verificar isolamento de dados entre estabelecimentos

Cenário:

- Estabelecimento A (FREE, 50 produtos)
- Estabelecimento B (PRO)

✅ Estabelecimento A não consegue criar #51:
POST /produtos (autenticado como usuário de A)
Response: 400 Bad Request

✅ Estabelecimento B consegue criar ilimitados:
POST /produtos (autenticado como usuário de B)
Response: 201 Created

✅ Contadores são isolados:
GET /plano/uso (usuário de A)
Response: { produtos: 50, ... }

GET /plano/uso (usuário de B)
Response: { produtos: 150, ... }

Cada chamada filtra por `estabelecimentoId` do token JWT
\*/

export {}; // Arquivo apenas para documentação
