#!/usr/bin/env node

/**
 * Script para criar usuário ADMIN via API REST
 * Usa o endpoint POST /auth/register que já está rodando no backend
 */

const http = require("http");

const API_BASE = "http://localhost:3000";

// Função para fazer requisições HTTP
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Passo 1: Obter CSRF token
async function getCsrfToken() {
  console.log("📋 Step 1: Obtendo CSRF token...");

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/auth/csrf-token",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log("  ✅ Token obtido com sucesso\n");
      return {
        token: data.csrfToken,
        cookies: response.headers["set-cookie"] || [],
      };
    } else {
      throw new Error(`Erro ao obter CSRF token: ${response.statusCode}`);
    }
  } catch (error) {
    throw new Error(`Erro ao conectar no servidor: ${error.message}`);
  }
}

// Passo 2: Criar usuário com CSRF token
async function createAdmin(csrfToken, cookies) {
  console.log("🔐 Step 2: Criando usuário ADMIN...");

  const payload = {
    nomeEstabelecimento: "Bar Stock Pro",
    nome: "Administrador",
    email: "admin@barstock.com.br",
    senha: "Admin@123456",
  };

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      Cookie: cookies.join("; "),
    },
  };

  try {
    const response = await makeRequest(options, payload);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log("  ✅ Usuário criado com sucesso!\n");
      return data.user;
    } else {
      const errorData = JSON.parse(response.body);
      throw new Error(
        errorData.message || `Erro ${response.statusCode} ao criar usuário`,
      );
    }
  } catch (error) {
    throw new Error(`Erro ao criar usuário: ${error.message}`);
  }
}

async function createAdminViaAPI() {
  console.log("\n🔐 Criando usuário ADMIN via API REST...\n");

  try {
    // Passo 1: Obter token CSRF
    const csrfTokenData = await getCsrfToken();

    // Passo 2: Criar usuário
    const user = await createAdmin(csrfTokenData.token, csrfTokenData.cookies);

    console.log("✅ Usuário criado com sucesso!\n");
    console.log("📝 Dados do usuário:");
    console.log(`  Email: ${user.email}`);
    console.log(`  Nome: ${user.nome}`);
    console.log(`  Role: ${user.role}\n`);
    console.log("🔓 Você pode fazer login com:");
    console.log(`  Email: admin@barstock.com.br`);
    console.log(`  Senha: Admin@123456\n`);

    return true;
  } catch (error) {
    console.log(`❌ Erro na criação: ${error.message}\n`);
    console.log("💡 Verifique se:");
    console.log("  1. O backend está rodando: npm run dev");
    console.log("  2. O banco de dados PostgreSQL está acessível");
    console.log("  3. O usuário não foi criado ainda\n");
    throw error;
  }
}

// Executar
createAdminViaAPI()
  .then(() => {
    console.log("✨ Processo concluído com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.log("🚫 Processo falhou:", error.message);
    process.exit(1);
  });
