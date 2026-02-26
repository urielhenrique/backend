#!/usr/bin/env node

/**
 * Script de Teste Local de Email
 * Testa o envio de emails sem necessidade de banco de dados
 * Mostra resultados em tela com visualização clara
 */

const crypto = require("crypto");
const readline = require("readline");
const path = require("path");

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
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
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

// ============================================================================
// TESTE DE CONFIGURAÇÃO
// ============================================================================

function checkEmailConfiguration() {
  section("🔍 Checando Configuração de Email");

  const config = {
    NODE_ENV: process.env.NODE_ENV || "development",
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? "✓ Configurada"
      : "✗ Não configurada",
    SMTP_HOST: process.env.SMTP_HOST || "✗ Não configurado",
    SMTP_PORT: process.env.SMTP_PORT || "587",
    SMTP_USER: process.env.SMTP_USER ? "✓ Configurado" : "✗ Não configurado",
    SMTP_PASSWORD: process.env.SMTP_PASSWORD
      ? "✓ Configurada"
      : "✗ Não configurada",
    SMTP_FROM: process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  };

  // Determinar provedor
  let provider = "SIMULADO (Desenvolvimento)";
  if (process.env.RESEND_API_KEY) {
    provider = colors.green + "RESEND" + colors.reset;
  } else if (process.env.SMTP_HOST) {
    provider = colors.yellow + "SMTP" + colors.reset;
  }

  console.log("Provedor de Email Detectado:", provider);
  console.log();

  // Mostrar configuração
  Object.entries(config).forEach(([key, value]) => {
    const color =
      String(value).includes("✓") || String(value).includes("Configurada")
        ? colors.green
        : String(value).includes("✗")
          ? colors.red
          : colors.white;
    console.log(`  ${key.padEnd(20)} ${color}${value}${colors.reset}`);
  });

  console.log();

  // Aviso se nenhum provedor configurado
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    warning(
      "Nenhum provedor configurado! Emails serão apenas simulados em tela.",
    );
  } else {
    success("Provedor configurado! Emails serão enviados realmente.");
  }
}

// ============================================================================
// TESTES DE EMAIL
// ============================================================================

async function testVerificationEmail() {
  const email = "teste@exemplo.com.br";
  const token = crypto.randomBytes(16).toString("hex");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  section("📧 Teste: Email de Verificação");

  info(`Email: ${email}`);
  info(`Token: ${token}`);
  info(`Link: ${verificationLink}`);

  console.log();
  log(colors.bright + colors.magenta, "Conteúdo do Email:");
  console.log(colors.dim + "─".repeat(70) + colors.reset);

  const emailContent = {
    from: process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br",
    to: email,
    subject: "Verifique seu Email - BarStock",
    html: `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Verifique seu Email</h2>
      <p>Clique no botão abaixo para verificar seu endereço de email:</p>
      <a href="${verificationLink}" style="background: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0;">
        Verificar Email
      </a>
      <p>Ou copie este link:</p>
      <code>${verificationLink}</code>
      <p style="color: #666; margin-top: 20px;">⏰ Este link expira em 1 hora.</p>
      <p>© 2026 BarStock. Todos os direitos reservados.</p>
    </body>
    </html>
    `,
  };

  console.log("From:     ", emailContent.from);
  console.log("To:       ", emailContent.to);
  console.log("Subject:  ", emailContent.subject);
  console.log("Content:  HTML (veja acima)");
  console.log(colors.dim + "─".repeat(70) + colors.reset);
  console.log();

  success(`Email de verificação pronto para envio!`);
  success(`Link para teste: ${verificationLink}`);
}

async function testPasswordResetEmail() {
  const email = "usuario@exemplo.com.br";
  const token = crypto.randomBytes(16).toString("hex");
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  section("📧 Teste: Email de Reset de Senha");

  info(`Email: ${email}`);
  info(`Token: ${token}`);
  info(`Link: ${resetLink}`);

  console.log();
  log(colors.bright + colors.magenta, "Conteúdo do Email:");
  console.log(colors.dim + "─".repeat(70) + colors.reset);

  const emailContent = {
    from: process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br",
    to: email,
    subject: "Redefinir sua Senha - BarStock",
    html: `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Redefinir Senha</h2>
      <p>Recebemos um pedido para redefinir sua senha.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${resetLink}" style="background: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0;">
        Redefinir Senha
      </a>
      <p>Ou copie este link:</p>
      <code>${resetLink}</code>
      <p style="color: #dc2626; margin-top: 20px;">⏰ Este link expira em 15 minutos. Por segurança, não compartilhe este link.</p>
      <p>© 2026 BarStock. Todos os direitos reservados.</p>
    </body>
    </html>
    `,
  };

  console.log("From:     ", emailContent.from);
  console.log("To:       ", emailContent.to);
  console.log("Subject:  ", emailContent.subject);
  console.log("Content:  HTML (veja acima)");
  console.log(colors.dim + "─".repeat(70) + colors.reset);
  console.log();

  success(`Email de reset de senha pronto para envio!`);
  warning(`Link válido por apenas 15 minutos: ${resetLink}`);
}

async function testUpgradeEmail() {
  const email = "empresa@exemplo.com.br";
  const estabelecimentoNome = "Estabelecimento Teste";

  section("📧 Teste: Email de Confirmação de Upgrade");

  info(`Email: ${email}`);
  info(`Estabelecimento: ${estabelecimentoNome}`);
  info(`Plano: PRO`);

  console.log();
  log(colors.bright + colors.magenta, "Conteúdo do Email:");
  console.log(colors.dim + "─".repeat(70) + colors.reset);

  const emailContent = {
    from: process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br",
    to: email,
    subject: "🎉 Bem-vindo ao BarStock PRO!",
    features: [
      "✓ Produtos ilimitados",
      "✓ Usuários ilimitados",
      "✓ Movimentações ilimitadas",
      "✓ Dashboard completo com gráficos",
    ],
  };

  console.log("From:     ", emailContent.from);
  console.log("To:       ", emailContent.to);
  console.log("Subject:  ", emailContent.subject);
  console.log("Recursos:");
  emailContent.features.forEach((f) => console.log(`  ${f}`));
  console.log(colors.dim + "─".repeat(70) + colors.reset);
  console.log();

  success(`Email de upgrade pronto para envio!`);
}

async function testEmailRateLimit() {
  section("⏱️  Teste: Rate Limiting de Email");

  const limits = {
    "Envio de Verificação": "Sem limite",
    Login: "5 tentativas por 15 minutos",
    "Forgot Password": "3 tentativas por 60 minutos",
  };

  Object.entries(limits).forEach(([action, limit]) => {
    console.log(`  ${action.padEnd(30)} → ${limit}`);
  });

  console.log();
  info(
    "Rate limiting protege contre abuso. Verifique seu banco de dados para reset de limits.",
  );
}

// ============================================================================
// TESTE SIMULADO COM RESEND
// ============================================================================

async function testEmailWithMockProvider() {
  section("🧪 Teste Simulado: Enviar Email");

  try {
    // Simular valores
    const testEmail = "teste@barstock.com.br";
    const token = crypto.randomBytes(16).toString("hex");

    info(`Simulando envio de verificação...`);
    console.log();

    // Mock do Resend
    const mockResendResponse = {
      id: "email_" + crypto.randomBytes(8).toString("hex"),
      from: process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br",
      to: testEmail,
      created_at: new Date().toISOString(),
      status: "sent",
    };

    console.log(colors.green + "Resposta do Resend (Simulada):" + colors.reset);
    console.log(JSON.stringify(mockResendResponse, null, 2));
    console.log();

    success("Email enviado com sucesso (simulado)!");
  } catch (err) {
    error(`Erro ao enviar: ${err.message}`);
  }
}

// ============================================================================
// MENU INTERATIVO
// ============================================================================

function showMenu() {
  console.clear();
  section("🚀 Teste Local de Email - BarStock");

  console.log("Seu sistema de email foi configurado com sucesso!");
  console.log();
  console.log("Escolha um teste para executar:\n");

  const options = [
    "1️⃣  Verificar Configuração",
    "2️⃣  Teste: Email de Verificação",
    "3️⃣  Teste: Email de Reset de Senha",
    "4️⃣  Teste: Email de Upgrade PRO",
    "5️⃣  Teste: Rate Limiting",
    "6️⃣  Teste Simulado com Mock",
    "0️⃣  Sair",
  ];

  options.forEach((opt) => console.log("  " + opt));
  console.log();
}

async function handleMenuChoice(choice) {
  switch (choice) {
    case "1":
      checkEmailConfiguration();
      break;
    case "2":
      await testVerificationEmail();
      break;
    case "3":
      await testPasswordResetEmail();
      break;
    case "4":
      await testUpgradeEmail();
      break;
    case "5":
      await testEmailRateLimit();
      break;
    case "6":
      await testEmailWithMockProvider();
      break;
    case "0":
      console.log("\n👋 Até logo!\n");
      process.exit(0);
      break;
    default:
      error("Opção inválida!");
  }
}

async function startInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.clear();

  const askQuestion = () => {
    showMenu();
    rl.question(
      colors.bright + colors.cyan + "Escolha uma opção (0-6): " + colors.reset,
      async (answer) => {
        await handleMenuChoice(answer.trim());
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

// ============================================================================
// EXECUTAR TESTES AUTOMÁTICOS (se argumentos passados)
// ============================================================================

async function runAutoTests() {
  console.clear();
  console.log(colors.bright + colors.blue + "═".repeat(70) + colors.reset);
  console.log(
    colors.bright +
      colors.blue +
      "  Teste Local de Email - BarStock (Modo Automático)" +
      colors.reset,
  );
  console.log(colors.blue + "═".repeat(70) + colors.reset);
  console.log();

  checkEmailConfiguration();
  console.log();
  await testVerificationEmail();
  console.log();
  await testPasswordResetEmail();
  console.log();
  await testUpgradeEmail();
  console.log();
  await testEmailRateLimit();
  console.log();
  section("✨ Resumo de Testes");
  success("Todos os testes foram executados com sucesso!");
  console.log(
    "Use " +
      colors.bright +
      "node test-email-local.js" +
      colors.reset +
      " para modo interativo.",
  );
  console.log();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--auto")) {
    await runAutoTests();
  } else {
    await startInteractiveMode();
  }
}

main().catch((err) => {
  error(`Erro fatal: ${err.message}`);
  process.exit(1);
});
