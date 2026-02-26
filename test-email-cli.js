#!/usr/bin/env node

/**
 * TEST EMAIL CLI - Teste de Emails via Linha de Comando
 *
 * Uso:
 *   node test-email-cli.js verify usuario@email.com
 *   node test-email-cli.js reset usuario@email.com
 *   node test-email-cli.js upgrade empresa@email.com
 *   node test-email-cli.js token [count]
 *   node test-email-cli.js config
 *   node test-email-cli.js help
 */

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Configure colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

// Load environment variables
require("dotenv").config();

class EmailTestCLI {
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    this.smtpFrom =
      process.env.SMTP_FROM || "noreply@barstock.coderonin.com.br";
    this.appName = "BarStock";
    this.expirationVerify = "1 hora";
    this.expirationReset = "15 minutos";
  }

  // Generate a token
  generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  // Hash a token with SHA256
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  // Print colored text
  print(message, color = "reset") {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // Print header
  printHeader(title, emoji = "📧") {
    console.log("");
    this.print(`${emoji} ${title}`, "cyan");
    this.print("─".repeat(60), "cyan");
  }

  // Print success message
  printSuccess(message) {
    this.print(`✅ ${message}`, "green");
  }

  // Print info message
  printInfo(message) {
    this.print(`ℹ️  ${message}`, "blue");
  }

  // Print warning message
  printWarning(message) {
    this.print(`⚠️  ${message}`, "yellow");
  }

  // Print error message
  printError(message) {
    this.print(`❌ ${message}`, "red");
  }

  // Print key-value pair
  printKV(key, value, color = "reset") {
    const padding = 25 - key.length;
    this.print(
      `${colors.bright}${key}:${colors.reset}${" ".repeat(Math.max(1, padding))}${value}`,
      color,
    );
  }

  // Show configuration
  showConfig() {
    this.printHeader("Configuração de Email", "⚙️");

    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSmtp = !!process.env.SMTP_HOST;

    this.printKV("NODE_ENV", process.env.NODE_ENV || "development");
    this.printKV("FRONTEND_URL", this.frontendUrl);
    this.printKV("SMTP_FROM", this.smtpFrom);
    console.log("");

    this.printKV(
      "Resend API",
      hasResend ? "✓ Configurado" : "✗ Não configurado",
      hasResend ? "green" : "red",
    );
    this.printKV(
      "SMTP Host",
      hasSmtp ? "✓ Configurado" : "✗ Não configurado",
      hasSmtp ? "green" : "red",
    );

    console.log("");

    const provider = hasResend ? "Resend" : hasSmtp ? "SMTP" : "Simulado";
    this.printInfo(
      `Provedor ativo: ${colors.bright}${provider}${colors.reset}`,
    );

    this.print("", "reset");
  }

  // Generate tokens
  generateTokens(count = 3) {
    this.printHeader("Geração de Tokens", "🔐");

    for (let i = 1; i <= count; i++) {
      const raw = this.generateToken();
      const hashed = this.hashToken(raw);

      console.log(`\n${colors.bright}Token ${i}:${colors.reset}`);
      this.printKV("Raw", raw);
      this.printKV("Hashed", hashed);
      this.printKV("Tamanho", `${raw.length} chars (${raw.length / 2} bytes)`);
    }

    console.log("");
    this.printInfo("Tokens raw são enviados ao usuário via email");
    this.printInfo("Tokens hashed são armazenados no banco de dados");
    this.print("", "reset");
  }

  // Test verification email
  testVerificationEmail(email) {
    this.printHeader(`Email de Verificação: ${email}`, "📧");

    if (!this.validateEmail(email)) {
      this.printError(`Email inválido: ${email}`);
      process.exit(1);
    }

    const token = this.generateToken();
    const hashed = this.hashToken(token);
    const link = `${this.frontendUrl}/verify-email?token=${token}`;

    console.log("");
    this.printKV("Destinatário", email);
    this.printKV("Assunto", "✉️ Verifique seu Email - " + this.appName);
    console.log("");

    this.print("Token Gerado:", "bright");
    this.printKV("Raw", token);
    this.printKV("Hashed BD", hashed);
    console.log("");

    this.print("Link de Verificação:", "bright");
    this.printKV("URL", link);
    console.log("");

    this.print("Detalhes:", "bright");
    this.printKV("Válido por", this.expirationVerify);
    this.printKV("Ação", "Ativa a conta do usuário");
    this.printKV("Segurança", "Token armazenado com hash SHA256");

    console.log("");
    this.printSuccess("Email pronto para envio!");

    // Show how to test
    console.log("");
    this.print("Como testar localmente:", "bright");
    this.print(`1. Copie a URL acima`, "dim");
    this.print(
      `2. Abra em seu navegador\n3. Frontend processará o token\n4. Banco será atualizado`,
      "dim",
    );

    this.print("", "reset");
  }

  // Test password reset email
  testPasswordResetEmail(email) {
    this.printHeader(`Email de Reset de Senha: ${email}`, "🔑");

    if (!this.validateEmail(email)) {
      this.printError(`Email inválido: ${email}`);
      process.exit(1);
    }

    const token = this.generateToken();
    const hashed = this.hashToken(token);
    const link = `${this.frontendUrl}/reset-password?token=${token}`;

    console.log("");
    this.printKV("Destinatário", email);
    this.printKV("Assunto", "🔐 Redefinir sua Senha - " + this.appName);
    console.log("");

    this.print("Token Gerado:", "bright");
    this.printKV("Raw", token);
    this.printKV("Hashed BD", hashed);
    console.log("");

    this.print("Link de Reset:", "bright");
    this.printKV("URL", link);
    console.log("");

    this.print("Detalhes:", "bright");
    this.printKV("Válido por", this.expirationReset);
    this.printKV("Ação", "Permite redefinir a senha");
    this.printKV("Segurança", "⚠️ Expiração curta por segurança");

    console.log("");
    this.printWarning("Este link expira em 15 MINUTOS!");

    console.log("");
    this.printSuccess("Email pronto para envio!");

    this.print("", "reset");
  }

  // Test upgrade email
  testUpgradeEmail(email) {
    this.printHeader(`Email de Upgrade PRO: ${email}`, "🎉");

    if (!this.validateEmail(email)) {
      this.printError(`Email inválido: ${email}`);
      process.exit(1);
    }

    console.log("");
    this.printKV("Destinatário", email);
    this.printKV("Assunto", "🎉 Bem-vindo ao " + this.appName + " PRO!");
    console.log("");

    this.print("Conteúdo do Email:", "bright");
    this.printKV("Título", "Você foi upgrading para PRO!");
    this.printKV("Recursos", "✓ Registros ilimitados");
    this.print(" ".repeat(25) + "✓ Dashboard avançado", "reset");
    this.print(" ".repeat(25) + "✓ Relatórios em PDF", "reset");
    this.print(" ".repeat(25) + "✓ Integração com ContaNova", "reset");
    this.print(" ".repeat(25) + "✓ Suporte prioritário", "reset");

    console.log("");
    this.print("Detalhes:", "bright");
    this.printKV("Tipo", "Notificação de upgrade");
    this.printKV("Válido por", "Indefinido");
    this.printKV("Ação", "Informa sobre novos recursos");

    console.log("");
    this.printSuccess("Email pronto para envio!");

    this.print("", "reset");
  }

  // Validate email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Show help
  showHelp() {
    console.log("");
    this.print(
      "╔════════════════════════════════════════════════════════════╗",
      "cyan",
    );
    this.print(
      "║         📧 EMAIL TEST CLI - Teste de Emails                ║",
      "cyan",
    );
    this.print(
      "╚════════════════════════════════════════════════════════════╝",
      "cyan",
    );

    console.log("");
    this.print("COMANDOS DISPONÍVEIS:", "bright");
    console.log("");

    console.log(` ${colors.green}verify <email>${colors.reset}`);
    this.print("   Testar email de verificação de conta", "dim");
    this.print(
      "   Exemplo: node test-email-cli.js verify usuario@email.com\n",
      "dim",
    );

    console.log(` ${colors.green}reset <email>${colors.reset}`);
    this.print("   Testar email de reset de senha", "dim");
    this.print(
      "   Exemplo: node test-email-cli.js reset usuario@email.com\n",
      "dim",
    );

    console.log(` ${colors.green}upgrade <email>${colors.reset}`);
    this.print("   Testar email de upgrade PRO", "dim");
    this.print(
      "   Exemplo: node test-email-cli.js upgrade empresa@email.com\n",
      "dim",
    );

    console.log(` ${colors.green}token [count]${colors.reset}`);
    this.print("   Gerar tokens de teste", "dim");
    this.print("   Exemplo: node test-email-cli.js token 5\n", "dim");

    console.log(` ${colors.green}config${colors.reset}`);
    this.print("   Mostrar configuração de email atual", "dim");
    this.print("   Exemplo: node test-email-cli.js config\n", "dim");

    console.log(` ${colors.green}help${colors.reset}`);
    this.print("   Mostrar esta ajuda", "dim");
    this.print("   Exemplo: node test-email-cli.js help\n", "dim");

    console.log("");
    this.print("EXEMPLOS:", "bright");
    console.log("");
    this.print("  # Testar verificação de email", "dim");
    this.print("  node test-email-cli.js verify joao@empresa.com\n", "yellow");

    this.print("  # Gerar 10 tokens para teste", "dim");
    this.print("  node test-email-cli.js token 10\n", "yellow");

    this.print("  # Ver configuração atual", "dim");
    this.print("  node test-email-cli.js config\n", "yellow");

    console.log("");
    this.print("VARIÁVEIS DE AMBIENTE ESPERADAS:", "bright");
    console.log("");
    this.print(
      "  FRONTEND_URL         - URL do frontend (padrão: http://localhost:5173)",
      "dim",
    );
    this.print(
      "  SMTP_FROM            - Email from (padrão: noreply@barstock.coderonin.com.br)",
      "dim",
    );
    this.print("  RESEND_API_KEY       - API key do Resend (opcional)", "dim");
    this.print("  SMTP_HOST            - Host SMTP (opcional)", "dim");
    this.print(
      "  node test-email-cli.js config para ver configuração atual",
      "dim",
    );

    console.log("");
    this.print("DOCUMENTAÇÃO COMPLETA:", "bright");
    this.print("  Ver EMAIL_TESTING_GUIDE.md para mais informações\n", "dim");

    this.print("", "reset");
  }

  // Run CLI
  run(args) {
    if (args.length === 0 || args[0] === "help") {
      this.showHelp();
      return;
    }

    const command = args[0].toLowerCase();
    const param = args[1];

    switch (command) {
      case "config":
        this.showConfig();
        break;

      case "token":
        const count = param ? parseInt(param) : 3;
        if (isNaN(count) || count < 1) {
          this.printError("Quantidade deve ser um número positivo");
          process.exit(1);
        }
        this.generateTokens(Math.min(count, 20)); // Máximo de 20 tokens
        break;

      case "verify":
        if (!param) {
          this.printError("Email não fornecido");
          this.printInfo(
            "Uso: node test-email-cli.js verify usuario@email.com",
          );
          process.exit(1);
        }
        this.testVerificationEmail(param);
        break;

      case "reset":
        if (!param) {
          this.printError("Email não fornecido");
          this.printInfo("Uso: node test-email-cli.js reset usuario@email.com");
          process.exit(1);
        }
        this.testPasswordResetEmail(param);
        break;

      case "upgrade":
        if (!param) {
          this.printError("Email não fornecido");
          this.printInfo(
            "Uso: node test-email-cli.js upgrade empresa@email.com",
          );
          process.exit(1);
        }
        this.testUpgradeEmail(param);
        break;

      default:
        this.printError(`Comando desconhecido: ${command}`);
        this.printInfo(
          'Digite "node test-email-cli.js help" para ver comandos disponíveis',
        );
        process.exit(1);
    }
  }
}

// Main
const cli = new EmailTestCLI();
const args = process.argv.slice(2);
cli.run(args);
