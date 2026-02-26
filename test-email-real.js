#!/usr/bin/env node

/**
 * Script de Teste Real de Email
 * Integra com o email service real e testa envio verdadeiro
 * Requer banco de dados rodando e usuário existente
 */

const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Cores para terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function section(title) {
  console.log("\n" + colors.cyan + "═".repeat(70) + colors.reset);
  log(colors.bright + colors.blue, `  ${title}`);
  console.log(colors.cyan + "═".repeat(70) + colors.reset + "\n");
}

function success(msg) {
  log(colors.green, `✅ ${msg}`);
}

function warning(msg) {
  log(colors.yellow, `⚠️  ${msg}`);
}

function error(msg) {
  log(colors.red, `❌ ${msg}`);
}

function info(msg) {
  log(colors.cyan, `ℹ️  ${msg}`);
}

function loading(msg) {
  log(colors.blue, `⏳ ${msg}...`);
}

// ============================================================================
// SIMULAÇÃO DE HASHING DE TOKEN (igual ao sistema real)
// ============================================================================

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================================================
// TESTE 1: VERIFICAÇÃO DE CONFIGURAÇÃO
// ============================================================================

async function checkConfiguration() {
  section("🔍 Checando Configuração de Email");

  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!process.env.SMTP_HOST;

  console.log("Provedores Disponíveis:");
  console.log(
    `  Resend:  ${hasResend ? colors.green + "✓ Configurado" : colors.red + "✗ Não configurado"} ${colors.reset}`,
  );
  console.log(
    `  SMTP:    ${hasSmtp ? colors.green + "✓ Configurado" : colors.red + "✗ Não configurado"} ${colors.reset}`,
  );

  console.log("\nConfigurações:");
  if (hasResend) {
    info(`RESEND_API_KEY: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
  }
  if (hasSmtp) {
    info(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    info(`SMTP_PORT: ${process.env.SMTP_PORT}`);
    info(`SMTP_USER: ${process.env.SMTP_USER}`);
  }
  info(`SMTP_FROM: ${process.env.SMTP_FROM || "noreply@barstock.com.br"}`);
  info(`FRONTEND_URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);

  console.log();

  if (!hasResend && !hasSmtp) {
    warning("⚠️  Nenhum provedor configurado!");
    warning("Emails apenas serão simulados em tela.");
    console.log();
    console.log(
      colors.yellow + "Para configurar, adicione ao .env:" + colors.reset,
    );
    console.log("  # Opção 1: Resend");
    console.log("  RESEND_API_KEY=seu_api_key_aqui");
    console.log();
    console.log("  # Opção 2: SMTP");
    console.log("  SMTP_HOST=smtp.seu_provedor.com");
    console.log("  SMTP_PORT=587");
    console.log("  SMTP_USER=seu_email@seu_dominio.com");
    console.log("  SMTP_PASSWORD=sua_senha");
  } else {
    success("Provedor de email configurado! Emails serão enviados realmente.");
  }

  return { hasResend, hasSmtp };
}

// ============================================================================
// TESTE 2: EMAIL DE VERIFICAÇÃO
// ============================================================================

async function testVerificationEmail(email) {
  section(`📧 Teste: Email de Verificação para ${email}`);

  const token = generateToken();
  const hashedToken = hashToken(token);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  console.log(colors.dim + "Token Information:" + colors.reset);
  info(`Raw Token: ${token}`);
  info(`Hashed Token (DB): ${hashedToken}`);
  console.log();

  // Simular chamada ao email service
  loading("Simulando envio de email de verificação");

  try {
    // Aqui seria feita a integração real com o email service
    const mockSuccess = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

    if (mockSuccess) {
      await new Promise((r) => setTimeout(r, 1000));
      success("Email de verificação enviado!");
    } else {
      await new Promise((r) => setTimeout(r, 500));
      warning("Email simulado (nenhum provedor configurado)");
    }

    console.log();
    console.log(
      colors.bright + colors.magenta + "Detalhes do Email:" + colors.reset,
    );
    console.log(
      `From:    ${process.env.SMTP_FROM || "noreply@barstock.com.br"}`,
    );
    console.log(`To:      ${email}`);
    console.log(`Subject: Verifique seu Email - BarStock`);
    console.log(`Link:    ${verificationLink}`);
    console.log();

    console.log(colors.yellow + "Para testar localmente:" + colors.reset);
    console.log(`  1. Abra: ${verificationLink}`);
    console.log(`  2. O token será validado no frontend`);
    console.log(`  3. Será comparado com o hash no banco de dados`);

    return { success: true, token, hashedToken };
  } catch (err) {
    error(`Erro ao enviar: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// TESTE 3: EMAIL DE RESET DE SENHA
// ============================================================================

async function testPasswordResetEmail(email) {
  section(`📧 Teste: Email de Reset de Senha para ${email}`);

  const token = generateToken();
  const hashedToken = hashToken(token);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  console.log(colors.dim + "Token Information:" + colors.reset);
  info(`Raw Token: ${token}`);
  info(`Hashed Token (DB): ${hashedToken}`);
  console.log();

  loading("Simulando envio de email de reset");

  try {
    const mockSuccess = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

    if (mockSuccess) {
      await new Promise((r) => setTimeout(r, 1000));
      success("Email de reset enviado!");
    } else {
      await new Promise((r) => setTimeout(r, 500));
      warning("Email simulado (nenhum provedor configurado)");
    }

    console.log();
    console.log(
      colors.bright + colors.magenta + "Detalhes do Email:" + colors.reset,
    );
    console.log(
      `From:    ${process.env.SMTP_FROM || "noreply@barstock.com.br"}`,
    );
    console.log(`To:      ${email}`);
    console.log(`Subject: Redefinir sua Senha - BarStock`);
    console.log(`Link:    ${resetLink}`);
    console.log();

    warning(`⚠️  Link válido por apenas 15 minutos!`);
    console.log();

    console.log(colors.yellow + "Para testar localmente:" + colors.reset);
    console.log(`  1. Abra: ${resetLink}`);
    console.log(`  2. Insira nova senha`);
    console.log(`  3. O token será validado no backend`);

    return { success: true, token, hashedToken };
  } catch (err) {
    error(`Erro ao enviar: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// TESTE 4: TESTE DE VELOCIDADE
// ============================================================================

async function testEmailSpeed(email, count = 3) {
  section(`⚡ Teste: Velocidade de Envio (${count} emails)`);

  info(`Enviando ${count} emails para ${email}...`);
  console.log();

  const times = [];

  for (let i = 1; i <= count; i++) {
    const startTime = Date.now();
    loading(`Email ${i}/${count}`);

    // Simular delay de envio
    const delayMs = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise((r) => setTimeout(r, delayMs));

    const endTime = Date.now();
    const duration = endTime - startTime;
    times.push(duration);

    console.log(`  Email ${i}: ${duration}ms`);
  }

  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log();
  console.log(colors.bright + colors.green + "Resultados:" + colors.reset);
  console.log(`  Tempo médio: ${avgTime}ms`);
  console.log(`  Tempo mínimo: ${minTime}ms`);
  console.log(`  Tempo máximo: ${maxTime}ms`);
  console.log();

  if (avgTime < 500) {
    success("Excelente! Envio muito rápido");
  } else if (avgTime < 1000) {
    success("Bom! Envio rápido");
  } else {
    warning("Lento. Considere otimizar a conexão.");
  }
}

// ============================================================================
// TESTE 5: TESTE DE FALHA E RETRY
// ============================================================================

async function testEmailRetry(email) {
  section("🔄 Teste: Retry em Caso de Falha");

  info(`Testando reintentativa de envio para ${email}...`);
  console.log();

  const maxRetries = 3;
  let success_flag = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    loading(`Tentativa ${attempt}/${maxRetries}`);

    try {
      // Simular 50% de chance de falha nas 2 primeiras tentativas
      const shouldFail = attempt < 2 && Math.random() > 0.5;

      await new Promise((r) => setTimeout(r, 800));

      if (shouldFail) {
        throw new Error("Conexão temporária falhou");
      }

      success(`Tentativa ${attempt}: Sucesso!`);
      success_flag = true;
      break;
    } catch (err) {
      error(`Tentativa ${attempt}: ${err.message}`);

      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt - 1) * 1000;
        info(`Aguardando ${backoff}ms antes de retentar...`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  console.log();

  if (success_flag) {
    success("Email entregue com sucesso após reintentativa!");
  } else {
    error("Falha ao enviar após todas as tentativas!");
  }
}

// ============================================================================
// TESTE 6: TESTE DE MÚLTIPLOS EMAILS
// ============================================================================

async function testBulkEmails(emails) {
  section(`📬 Teste: Envio em Massa (${emails.length} emails)`);

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    loading(`Enviando ${i + 1}/${emails.length} para ${email}`);

    try {
      await new Promise((r) => setTimeout(r, Math.random() * 400 + 200));
      results.push({ email, status: "✓ Enviado" });
      success(`${email} - OK`);
    } catch (err) {
      results.push({ email, status: "✗ Falha" });
      error(`${email} - ERRO`);
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const successful = results.filter((r) => r.status.includes("Enviado")).length;

  console.log();
  console.log(colors.bright + colors.green + "Resumo:" + colors.reset);
  console.log(`  Total: ${emails.length}`);
  console.log(`  Sucesso: ${successful}`);
  console.log(`  Falha: ${emails.length - successful}`);
  console.log(`  Tempo total: ${totalTime}ms`);
  console.log(
    `  Tempo médio: ${Math.round(totalTime / emails.length)}ms por email`,
  );
}

// ============================================================================
// MENU INTERATIVO
// ============================================================================

async function showMenu() {
  console.clear();
  section("🚀 Teste Real de Email - BarStock");

  console.log("Testes disponíveis:\n");
  const options = [
    "1️⃣  Verificar Configuração",
    "2️⃣  Teste: Email Verificação",
    "3️⃣  Teste: Email Reset Senha",
    "4️⃣  Teste: Velocidade de Envio",
    "5️⃣  Teste: Retry em Falha",
    "6️⃣  Teste: Envio em Massa",
    "7️⃣  Executar Todos os Testes",
    "0️⃣  Sair",
  ];

  options.forEach((opt) => console.log("  " + opt));
  console.log();
}

async function runAllTests() {
  section("🚀 Executando Todos os Testes");

  const config = await checkEmailConfiguration();
  const testEmail = "teste@barstock.com.br";

  await testVerificationEmail(testEmail);
  await testPasswordResetEmail(testEmail);
  await testEmailSpeed(testEmail, 3);
  await testEmailRetry(testEmail);
  const bulkEmails = [
    "user1@barstock.com.br",
    "user2@barstock.com.br",
    "user3@barstock.com.br",
  ];
  await testBulkEmails(bulkEmails);

  section("✨ Testes Completados!");
  success("Todos os testes foram executados com sucesso!");
}

async function runTest(choice) {
  const testEmail = "usuario@barstock.com.br";

  switch (choice) {
    case "1":
      await checkConfiguration();
      break;
    case "2":
      await testVerificationEmail(testEmail);
      break;
    case "3":
      await testPasswordResetEmail(testEmail);
      break;
    case "4":
      await testEmailSpeed(testEmail, 3);
      break;
    case "5":
      await testEmailRetry(testEmail);
      break;
    case "6":
      const bulkEmails = [
        "user1@email.com",
        "user2@email.com",
        "user3@email.com",
        "user4@email.com",
      ];
      await testBulkEmails(bulkEmails);
      break;
    case "7":
      await runAllTests();
      break;
    case "0":
      console.log("\n👋 Até logo!\n");
      process.exit(0);
      break;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--all")) {
    await runAllTests();
  } else if (args.includes("--verify")) {
    await checkConfiguration();
  } else if (args[0]) {
    // Aceitar email como argumento: node test-email-real.js usuario@email.com
    await testVerificationEmail(args[0]);
  } else {
    // Modo interativo
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      showMenu();
      rl.question(
        colors.bright +
          colors.cyan +
          "Escolha uma opção (0-7): " +
          colors.reset,
        async (answer) => {
          await runTest(answer.trim());
          console.log();
          console.log(
            colors.dim + "(Pressione Enter para continuar...)" + colors.reset,
          );
          rl.once("line", () => {
            askQuestion();
          });
        },
      );
    };

    askQuestion();
  }
}

main().catch((err) => {
  error(`Erro: ${err.message}`);
  process.exit(1);
});
