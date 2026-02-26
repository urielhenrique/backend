const http = require("http");

// Armazenar cookies entre requisições
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
        // Capturar cookies da resposta
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

async function runTests() {
  try {
    console.log("\n===== TESTE DO FLUXO COMPLETO =====\n");

    // 1. Obter CSRF Token
    console.log("1️⃣ TESTE: Obter CSRF Token");
    const csrfRes = await makeRequest("GET", "/auth/csrf-token");
    const csrfToken = csrfRes.body.csrfToken;
    console.log("✅ Status:", csrfRes.status);
    console.log("✅ CSRF Token recebido:", csrfToken.substring(0, 10) + "...");
    console.log("");

    // 2. Registrar usuário
    console.log("2️⃣ TESTE: Registrar Novo Usuário");
    const email = `testuser_${Date.now()}@test.com`;
    const password = "Senha@123";
    const nomeEstabelecimento = "Estabelecimento Teste";

    const registerRes = await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Test User",
        email: email,
        senha: password,
        confirmaSenha: password,
        nomeEstabelecimento: nomeEstabelecimento,
      },
      {
        "X-CSRF-Token": csrfToken,
      },
    );

    console.log("✅ Status:", registerRes.status);
    if (registerRes.status !== 201 && registerRes.status !== 200) {
      console.log(
        "❌ ERRO ao registrar:",
        registerRes.body.message || JSON.stringify(registerRes.body),
      );
      return;
    }
    console.log("✅ Email registrado:", email);
    console.log("✅ Email verificado:", registerRes.body.user.emailVerified);

    // Obter token de verificação via endpoint de teste
    const getTokenRes = await makeRequest(
      "GET",
      `/auth/test/get-verification-token/${email}`,
    );
    if (getTokenRes.status !== 200) {
      console.log("❌ ERRO ao obter token:", getTokenRes.body);
      return;
    }
    const verificationToken = getTokenRes.body.emailVerificationToken;
    console.log("✅ Token de verificação obtido");
    console.log("");

    // 3. Tentar login ANTES de verificar email
    console.log("3️⃣ TESTE: Tentar Login com Email Não Verificado");
    const loginRes1 = await makeRequest(
      "POST",
      "/auth/login",
      {
        email: email,
        senha: password,
      },
      {
        "X-CSRF-Token": csrfToken,
      },
    );
    console.log("✅ Status:", loginRes1.status);
    console.log("✅ Resposta:", loginRes1.body.message || loginRes1.body.error);
    console.log("");

    // 4. Verificar email
    console.log("4️⃣ TESTE: Verificar Email");
    const verifyRes = await makeRequest(
      "GET",
      `/auth/verify-email?token=${verificationToken}`,
    );
    console.log("✅ Status:", verifyRes.status);
    console.log("✅ Resposta:", verifyRes.body.message || verifyRes.body);
    console.log("");

    // 5. Tentar login DEPOIS de verificar email
    console.log("5️⃣ TESTE: Login após Verificação de Email");
    const loginRes2 = await makeRequest(
      "POST",
      "/auth/login",
      {
        email: email,
        senha: password,
      },
      {
        "X-CSRF-Token": csrfToken,
      },
    );
    console.log("✅ Status:", loginRes2.status);
    if (loginRes2.status === 200) {
      console.log("✅ Login bem-sucedido!");
      console.log(
        "✅ Token JWT recebido:",
        loginRes2.body.token ? "Sim" : "Não",
      );
    } else {
      console.log(
        "❌ ERRO ao fazer login:",
        loginRes2.body.message || loginRes2.body.error,
      );
    }
    console.log("");

    // 6. Testar Forgot Password
    console.log("6️⃣ TESTE: Forgot Password");
    const forgotRes = await makeRequest(
      "POST",
      "/auth/forgot-password",
      {
        email: email,
      },
      {
        "X-CSRF-Token": csrfToken,
      },
    );
    console.log("✅ Status:", forgotRes.status);
    console.log("✅ Resposta:", forgotRes.body.message);
    console.log("");

    // 7. Testar Reset Password (com token inválido primeiro)
    console.log("7️⃣ TESTE: Reset Password com Token Inválido");
    const resetRes1 = await makeRequest(
      "POST",
      "/auth/reset-password",
      {
        token: "token_invalido",
        senha: "NovaSenha@123",
        confirmaSenha: "NovaSenha@123",
      },
      {
        "X-CSRF-Token": csrfToken,
      },
    );
    console.log("✅ Status:", resetRes1.status);
    console.log("✅ Erro Esperado:", resetRes1.body.error);
    console.log("");

    console.log("===== FIM DOS TESTES =====\n");
  } catch (error) {
    console.error("❌ ERRO:", error.message);
  }
}

runTests();
