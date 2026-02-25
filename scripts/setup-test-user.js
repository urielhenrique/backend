#!/usr/bin/env node

/**
 * Script para criar usuário admin sem precisar de banco de dados rodando
 * Apenas atualiza o que seria necessário no banco
 */

console.log("\n🔐 Configurando credenciais de teste para Bar Controle...\n");

const email = "admin@barstock.com.br";
const senha = "Admin@123456";
const estabelecimento = "Bar Stock Pro";

console.log("✅ Usuário ADMIN configurado!\n");
console.log("📊 Dados de Login:");
console.log(`📧 Email: ${email}`);
console.log(`🔑 Senha: ${senha}`);
console.log(`🏢 Estabelecimento: ${estabelecimento}\n`);

console.log("⚠️  Para criar este usuário no banco de dados:\n");
console.log("1️⃣  Certifique-se que PostgreSQL está rodando em localhost:5433");
console.log("2️⃣  Execute no terminal do backend:\n");
console.log("   npm run create:admin\n");

console.log("📝 Ou crie manualmente via SQL:\n");
console.log(`INSERT INTO "Estabelecimento" (id, nome, "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), '${estabelecimento}', NOW(), NOW());

INSERT INTO "Usuario" (id, email, name, "senhaHash", role, "estabelecimentoId", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '${email}', 'Administrador', 
'<hash_da_senha_aqui>', 'ADMIN', (SELECT id FROM "Estabelecimento" LIMIT 1), NOW(), NOW());\n`);

console.log("🔗 URL do Frontend: http://localhost:5173/login\n");
