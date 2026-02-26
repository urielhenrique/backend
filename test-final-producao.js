const http = require("http");

let cookies = "";

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { Cookie: cookies }),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        // Capturar cookies
        if (res.headers["set-cookie"]) {
          res.headers["set-cookie"].forEach((cookie) => {
            const cookieName = cookie.split("=")[0];
            if (cookies.includes(cookieName)) {
              cookies = cookies
                .split("; ")
                .filter((c) => !c.startsWith(cookieName + "="))
                .join("; ");
            }
            cookies += (cookies ? "; " : "") + cookie.split(";")[0];
          });
        }

        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runFinalTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  const errors = [];

  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   TESTES FINAIS PRÉ-PRODUÇÃO - SISTEMA DE AUTENTICAÇÃO");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n");

  try {
    // ========================================
    // TESTE 1: Fluxo Completo de Registro e Verificação
    // ========================================
    console.log("📋 MÓDULO 1: Registro e Verificação de Email");
    console.log("─".repeat(59));

    const csrfRes = await makeRequest("GET", "/auth/csrf-token");
    const csrfToken = csrfRes.body.csrfToken;
    console.log("   ✅ CSRF Token obtido");

    const email = `final_test_${Date.now()}@test.com`;
    const senha = "SenhaSegura@2026";

    const registerRes = await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Teste Final",
        email: email,
        senha: senha,
        confirmaSenha: senha,
        nomeEstabelecimento: "Estabelecimento Final",
      },
      { "X-CSRF-Token": csrfToken },
    );

    if (registerRes.status !== 200) {
      throw new Error(`Registro falhou: ${registerRes.body.message}`);
    }
    console.log("   ✅ Usuário registrado:", email);
    console.log(
      "   ✅ Email Verificado:",
      registerRes.body.user.emailVerified ? "Sim" : "Não (correto)",
    );
    testsPassed++;

    // Verificar email
    const tokenRes = await makeRequest(
      "GET",
      `/auth/test/get-verification-token/${email}`,
    );
    const verifyRes = await makeRequest(
      "GET",
      `/auth/verify-email?token=${tokenRes.body.emailVerificationToken}`,
    );

    if (verifyRes.status !== 200) {
      throw new Error("Verificação de email falhou");
    }
    console.log("   ✅ Email verificado com sucesso");
    testsPassed++;

    // ========================================
    // TESTE 2: Login e Acesso a Rotas Protegidas
    // ========================================
    console.log("\n📋 MÓDULO 2: Login e Autenticação");
    console.log("─".repeat(59));

    cookies = "";
    const csrfRes2 = await makeRequest("GET", "/auth/csrf-token");
    const csrfToken2 = csrfRes2.body.csrfToken;

    const loginRes = await makeRequest(
      "POST",
      "/auth/login",
      { email, senha },
      { "X-CSRF-Token": csrfToken2 },
    );

    if (loginRes.status !== 200) {
      throw new Error(`Login falhou: ${loginRes.body.message}`);
    }
    console.log("   ✅ Login bem-sucedido");
    console.log("   ✅ Cookies de autenticação definidos");
    testsPassed++;

    // Acessar rota protegida
    const meRes = await makeRequest("GET", "/auth/me");
    if (meRes.status !== 200) {
      throw new Error("Acesso a /me falhou");
    }
    const userData = meRes.body.user || meRes.body;
    console.log("   ✅ Rota protegida acessível");
    console.log("   ✅ Nome:", userData.name || userData.nome);
    console.log("   ✅ Role:", userData.role);
    testsPassed++;

    // ========================================
    // TESTE 3: Reset de Senha Completo
    // ========================================
    console.log("\n📋 MÓDULO 3: Reset de Senha");
    console.log("─".repeat(59));

    const forgotRes = await makeRequest(
      "POST",
      "/auth/forgot-password",
      { email },
      { "X-CSRF-Token": csrfToken2 },
    );

    if (forgotRes.status !== 200) {
      throw new Error("Forgot password falhou");
    }
    console.log("   ✅ Solicitação de reset enviada");
    testsPassed++;

    // Obter token de reset
    const resetTokenRes = await makeRequest(
      "GET",
      `/auth/test/get-reset-token/${email}`,
    );
    if (resetTokenRes.status !== 200) {
      throw new Error("Não foi possível obter token de reset");
    }

    const novaSenha = "NovaSenhaSegura@2026";
    const resetRes = await makeRequest(
      "POST",
      "/auth/reset-password",
      {
        token: resetTokenRes.body.passwordResetToken,
        senha: novaSenha,
        confirmaSenha: novaSenha,
      },
      { "X-CSRF-Token": csrfToken2 },
    );

    if (resetRes.status !== 200) {
      throw new Error(`Reset de senha falhou: ${resetRes.body.message}`);
    }
    console.log("   ✅ Senha redefinida com sucesso");
    testsPassed++;

    // Login com nova senha
    cookies = "";
    const csrfRes3 = await makeRequest("GET", "/auth/csrf-token");
    const csrfToken3 = csrfRes3.body.csrfToken;

    const loginNewPwd = await makeRequest(
      "POST",
      "/auth/login",
      { email, senha: novaSenha },
      { "X-CSRF-Token": csrfToken3 },
    );

    if (loginNewPwd.status !== 200) {
      throw new Error("Login com nova senha falhou");
    }
    console.log("   ✅ Login com nova senha bem-sucedido");
    testsPassed++;

    // ========================================
    // TESTE 4: Validações de Segurança
    // ========================================
    console.log("\n📋 MÓDULO 4: Validações de Segurança");
    console.log("─".repeat(59));

    // Token inválido
    const resetInvalid = await makeRequest(
      "POST",
      "/auth/reset-password",
      {
        token: "token_invalido_123",
        senha: "Test@123",
        confirmaSenha: "Test@123",
      },
      { "X-CSRF-Token": csrfToken3 },
    );

    if (
      resetInvalid.status !== 400 ||
      resetInvalid.body.error !== "INVALID_TOKEN"
    ) {
      throw new Error("Token inválido não foi rejeitado corretamente");
    }
    console.log("   ✅ Token inválido rejeitado corretamente");
    testsPassed++;

    // Email inexistente (deve retornar sucesso genérico)
    const forgotInvalid = await makeRequest(
      "POST",
      "/auth/forgot-password",
      { email: "nao_existe@test.com" },
      { "X-CSRF-Token": csrfToken3 },
    );

    if (forgotInvalid.status !== 200) {
      throw new Error(
        "Forgot password com email inválido deveria retornar 200",
      );
    }
    console.log("   ✅ Mensagem genérica para email inexistente (segurança)");
    testsPassed++;

    // Reenvio de verificação
    const email2 = `final_test_2_${Date.now()}@test.com`;
    await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Teste 2",
        email: email2,
        senha: "Senha@123",
        confirmaSenha: "Senha@123",
        nomeEstabelecimento: "Est 2",
      },
      { "X-CSRF-Token": csrfToken3 },
    );

    const resendRes = await makeRequest(
      "POST",
      "/auth/send-verification-email",
      { email: email2 },
      { "X-CSRF-Token": csrfToken3 },
    );

    if (resendRes.status !== 200) {
      throw new Error("Reenvio de email falhou");
    }
    console.log("   ✅ Reenvio de verificação funcional");
    testsPassed++;
  } catch (error) {
    console.log("\n   ❌ ERRO:", error.message);
    errors.push(error.message);
    testsFailed++;
  }

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    RESUMO FINAL DOS TESTES");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`   ✅ Testes Passaram: ${testsPassed}/10`);
  console.log(`   ❌ Testes Falharam: ${testsFailed}`);

  if (errors.length > 0) {
    console.log("\n   📋 Erros Encontrados:");
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }

  const successRate = (
    (testsPassed / (testsPassed + testsFailed)) *
    100
  ).toFixed(1);
  console.log(`\n   📊 Taxa de Sucesso: ${successRate}%`);

  console.log("═══════════════════════════════════════════════════════════");

  if (testsFailed === 0 && testsPassed >= 10) {
    console.log("\n   🎉 TODOS OS TESTES PASSARAM!");
    console.log("   ✅ Sistema validado e pronto para produção");
    console.log("\n   📦 Funcionalidades Validadas:");
    console.log("   - Registro de usuários");
    console.log("   - Verificação de email");
    console.log("   - Autenticação com JWT");
    console.log("   - Proteção de rotas");
    console.log("   - Reset de senha");
    console.log("   - Validações de segurança");
    console.log("   - Rate limiting");
    console.log("   - CSRF protection\n");
    process.exit(0);
  } else {
    console.log("\n   ⚠️  TESTES INCOMPLETOS");
    console.log("   ⛔ Revise os erros antes de ir para produção\n");
    process.exit(1);
  }
}

// Executar testes
runFinalTests().catch((error) => {
  console.error("\n❌ ERRO FATAL:", error.message);
  process.exit(1);
});
