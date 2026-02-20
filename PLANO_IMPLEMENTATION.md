# 📚 Documentação: Sistema de Planos Free vs Pro

## 📋 Visão Geral

O sistema de planos implementa validação de limites antes de criar registros no banco de dados, garantindo que estabelecimentos com plano FREE respeitam suas cotas.

### Limites Padrão

| Recurso           | FREE | PRO       |
| ----------------- | ---- | --------- |
| Produtos          | 50   | Ilimitado |
| Usuários          | 1    | Ilimitado |
| Movimentações/Mês | 1000 | Ilimitado |

---

## 🔧 Implementação

### 1. PlanoService (`src/shared/services/plano.service.ts`)

Serviço centralizado para todas as validações de limites.

#### Métodos Principais

```typescript
// Valida limite antes de criar
await planoService.checkLimite(estabelecimentoId, "produto");
await planoService.checkLimite(estabelecimentoId, "usuario");
await planoService.checkLimite(estabelecimentoId, "movimentacao");

// Retorna limites do estabelecimento
const limites = await planoService.getLimites(estabelecimentoId);

// Retorna uso atual
const uso = await planoService.getUso(estabelecimentoId);
```

#### Fluxo de Validação

```
checkLimite(estabelecimentoId, tipo)
  ↓
Busca estabelecimento (plano FREE/PRO)
  ↓
Se PRO → Retorna (sem validação)
↓
Se FREE:
  - Conta registros atuais
  - Compara com limite configurado
  - Se atendeu limite → Lança erro
  - Se dentro do limite → Retorna
```

---

## 📊 Integração por Módulo

### 2. ProdutoService - `src/modules/produto/produto.service.ts`

```typescript
import { PlanoService } from "../../shared/services/plano.service";

export class ProdutoService {
  private repository = new ProdutoRepository();
  private planoService = new PlanoService();

  async create(estabelecimentoId: string, data: any) {
    // ✅ VALIDAÇÃO OCORRE ANTES DE CRIAR
    await this.planoService.checkLimite(estabelecimentoId, "produto");

    const estoqueAtual = data.estoqueAtual ?? 0;
    const estoqueMinimo = data.estoqueMinimo ?? 5;
    const status = this.calcularStatus(estoqueAtual, estoqueMinimo);

    return this.repository.create({
      ...data,
      estabelecimentoId,
      status,
    });
  }
}
```

**Comportamento:**

- Se FREE com 50 produtos → ❌ Erro: "Limite do plano FREE atingido (50 produtos)"
- Se FREE com 49 produtos → ✅ Cria com sucesso
- Se PRO → ✅ Cria com sucesso (sem validação)

---

### 3. MovimentacaoService - `src/modules/movimentacao/movimentacao.service.ts`

```typescript
import { PlanoService } from "../../shared/services/plano.service";

export class MovimentacaoService {
  private repository = new MovimentacaoRepository();
  private planoService = new PlanoService();

  async create(estabelecimentoId: string, data: any) {
    // ✅ VALIDAÇÃO OCORRE ANTES DE CRIAR
    await this.planoService.checkLimite(estabelecimentoId, "movimentacao");

    return prisma.$transaction(async (tx: any) => {
      // ... resto da lógica
      return tx.movimentacao.create({
        data: {
          produtoId: produto.id,
          estabelecimentoId,
          tipo: data.tipo,
          quantidade,
          observacao: data.observacao,
          valorUnitario,
          valorTotal,
        },
      });
    });
  }
}
```

**Comportamento:**

- Conta movimentações do MÊS ATUAL (createdAt)
- Se FREE com 1000 movimentações em janeiro → ❌ Recusa movimentação
- Se em fevereiro → ✅ Reseta contador, permite criar

---

### 4. AuthService - Criar Usuários - `src/modules/auth/auth.service.ts`

```typescript
import { PlanoService } from "../../shared/services/plano.service";

export class AuthService {
  private planoService = new PlanoService();

  /**
   * Cria novo usuário com validação de limites
   */
  async createUsuario(
    estabelecimentoId: string,
    nome: string,
    email: string,
    senha: string,
    role: "ADMIN" | "FUNCIONARIO" = "FUNCIONARIO",
  ) {
    // ✅ VALIDAÇÃO OCORRE ANTES DE CRIAR
    await this.planoService.checkLimite(estabelecimentoId, "usuario");

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        role,
        estabelecimentoId,
      },
    });

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    };
  }
}
```

**Comportamento:**

- FREE com 1 usuário → ❌ Erro: "Limite do plano FREE atingido (1 usuário)"
- FREE com 0 usuários → ✅ Cria primeiro usuário
- PRO → ✅ Sem limites

---

## 🎯 Casos de Uso

### Caso 1: Criar Produto em Estabelecimento FREE

```javascript
// Frontend/Cliente
POST /produtos
{
  "nome": "Cerveja Premium",
  "categoria": "Cerveja",
  "preco_venda": 15.90,
  "estabelecimento_id": "abc123"
}

// Resposta se atingiu limite:
{
  "error": "Limite do plano FREE atingido (50 produtos). Faça upgrade para PRO."
}
```

### Caso 2: Criar Movimentação Além do Limite Mensal

```javascript
// Frontend/Cliente
POST /movimentacoes
{
  "produtoId": "prod123",
  "tipo": "Saida",
  "quantidade": 10,
  "estabelecimento_id": "abc123"
}

// Resposta se atingiu limite (1000/mês):
{
  "error": "Limite do plano FREE atingido (1000 movimentações por mês). Faça upgrade para PRO."
}
```

### Caso 3: Adicionar Segundo Usuário (Plano FREE)

```javascript
POST /auth/criar-usuario
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "senha": "senha123",
  "estabelecimento_id": "abc123"
}

// Resposta:
{
  "error": "Limite do plano FREE atingido (1 usuário). Faça upgrade para PRO."
}
```

---

## 📈 Obter Status de Uso

Para mostrar progresso ao usuário, use:

```typescript
// Em um novo endpoint ou método
const planoService = new PlanoService();

// Limites do plano
const limites = await planoService.getLimites(estabelecimentoId);
// {
//   plano: "FREE",
//   limiteProdutos: 50,
//   limiteUsuarios: 1,
//   limiteMovimentacaoMensal: 1000
// }

// Uso atual
const uso = await planoService.getUso(estabelecimentoId);
// {
//   produtos: 48,
//   usuarios: 1,
//   movimentacaoMes: 892
// }

// Calcular percentual
const percentualProdutos = (uso.produtos / limites.limiteProdutos) * 100; // 96%
const percentualMovimentacao =
  (uso.movimentacaoMes / limites.limiteMovimentacaoMensal) * 100; // 89.2%
```

---

## 🔄 Fluxo Completo: Upgrade para PRO

```typescript
// 1. Usuário clica "Upgrade"
// 2. Processa pagamento
// 3. Atualiza estabelecimento
await prisma.estabelecimento.update({
  where: { id: estabelecimentoId },
  data: { plano: "PRO" }
});

// 4. PlanoService detecta PRO na próxima validação
const estabelecimento = await prisma.estabelecimento.findUnique({...});
if (estabelecimento.plano === "PRO") {
  return; // Sem validação de limites
}
```

---

## 🛡️ Performance & Otimização

### Queries Otimizadas

```typescript
// Usa COUNT eficiente (não retorna dados)
const count = await prisma.produto.count({
  where: { estabelecimentoId },
});

// Filtra por mês com índice composto
const count = await prisma.movimentacao.count({
  where: {
    estabelecimentoId, // ← índice: (estabelecimentoId)
    createdAt: {
      gte: firstDayOfMonth,
      lte: lastDayOfMonth,
    },
  },
});

// Índices no Prisma Schema:
// @@index([estabelecimentoId])
// @@index([estabelecimentoId, createdAt])
// @@index([estabelecimentoId, data])
```

### Caching (Recomendado para Produção)

```typescript
// Com Redis/Memcached:
const cacheKey = `plano:${estabelecimentoId}`;
let limites = await cache.get(cacheKey);

if (!limites) {
  limites = await planoService.getLimites(estabelecimentoId);
  await cache.set(cacheKey, limites, 3600); // 1 hora
}
```

---

## ⚙️ Próximos Passos

1. **Executar Migration:**

   ```bash
   npx prisma migrate dev --name add-tenant-indexes-and-limits
   npx prisma generate
   ```

2. **Criar Controller para Dashboard:**

   ```typescript
   GET / dashboard / plano;
   // Retorna limites e uso atual
   ```

3. **Adicionar Webhooks:**
   - Alertar quando atingir 80% do limite
   - Desativar recursos quando limite atingido

4. **Relatórios:**
   - Mostrar tendência de uso
   - Recomendar quando fazer upgrade
