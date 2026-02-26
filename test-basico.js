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
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function test() {
  try {
    // Obter CSRF
    const csrfRes = await makeRequest("GET", "/auth/csrf-token");
    const csrfToken = csrfRes.body.csrfToken;
    console.log("✅ 1. CSRF Token obtido");

    // Registrar
    const email = `teste_${Date.now()}@test.com`;
    const registerRes = await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Test User",
        email: email,
        senha: "Senha@123",
        confirmaSenha: "Senha@123",
        nomeEstabelecimento: "Test Estabelecimento",
      },
      { "X-CSRF-Token": csrfToken },
    );

    console.log("✅ 2. Usuário registrado com email:", email);

    // Obter token de verificação
    const tokenRes = await makeRequest(
      "GET",
      `/auth/test/get-verification-token/${email}`,
    );
    const token = tokenRes.body.emailVerificationToken;
    console.log(
      "✅ 3. Token de verificação obtido (hasheado):",
      token?.substring(0, 15) + "...",
    );

    // Tentar LOGAR SEM VERIFICAR EMAIL
    console.log("\n🔴 Teste 1: Login SEM email verificado");
    const login1Res = await makeRequest(
      "POST",
      "/auth/login",
      {
        email: email,
        senha: "Senha@123",
      },
      { "X-CSRF-Token": csrfToken },
    );

    console.log("   Status:", login1Res.status);
    console.log("   Mensagem:", login1Res.body.message || login1Res.body.error);

    // Verificaremos um novo usuário e testaremos login
    console.log("\n🟢 Teste 2: Registre e verifique com /me");
    const email2 = `teste2_${Date.now()}@test.com`;
    const reg2Res = await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Test User 2",
        email: email2,
        senha: "Senha@123",
        confirmaSenha: "Senha@123",
        nomeEstabelecimento: "Test Est 2",
      },
      { "X-CSRF-Token": csrfToken },
    );

    console.log("   Usuario 2 registrado:", email2);

    // Fazer uma chamada /me sem login (deve falhar)
    const meRes = await makeRequest("GET", "/auth/me");
    console.log("   GET /me sem login retorna:", meRes.status);

    console.log("\n✅ Testes básicos completados!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

test();
