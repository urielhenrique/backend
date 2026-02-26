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
    console.log("1. CSRF Token:", csrfToken.substring(0, 15) + "...");

    // Registrar
    const email = `teste_simples_${Date.now()}@test.com`;
    const registerRes = await makeRequest(
      "POST",
      "/auth/register",
      {
        nome: "Test",
        email: email,
        senha: "Senha@123",
        confirmaSenha: "Senha@123",
        nomeEstabelecimento: "Test Est",
      },
      { "X-CSRF-Token": csrfToken },
    );

    console.log("2. Registrou com status:", registerRes.status);
    console.log("   User ID:", registerRes.body.user?.id);
    console.log("   Email:", registerRes.body.user?.email);

    // Verificar dados salvos (usar prisma diretamente)
    console.log("\n3. Verificando dados no banco...");
    const prisma = require("./dist/shared/database/prisma").default;
    const user = await prisma.usuario.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        senhaHash: true,
        emailVerified: true,
      },
    });

    if (user) {
      console.log("   Usuario encontrado:");
      console.log("   - Email:", user.email);
      console.log(
        "   - SenhaHash:",
        user.senhaHash
          ? "✅ Salvo (len: " + user.senhaHash.length + ")"
          : "❌ NULL/UNDEFINED",
      );
      console.log("   - EmailVerified:", user.emailVerified);
    } else {
      console.log("   ❌ Usuario não encontrado!");
    }

    // Tentar login
    console.log("\n4. Tentando login...");
    const loginRes = await makeRequest(
      "POST",
      "/auth/login",
      {
        email: email,
        senha: "Senha@123",
      },
      { "X-CSRF-Token": csrfToken },
    );

    console.log("   Status:", loginRes.status);
    console.log("   Erro:", loginRes.body.error || loginRes.body.message);

    await prisma.$disconnect();
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

test();
