import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@barstock.com.br";

// Inicializa transporter apenas se as variáveis estiverem configuradas
const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    })
  : null;

export class EmailService {
  /**
   * Verificar se email está configurado
   */
  private ensureEmailConfigured(): void {
    if (!transporter) {
      console.warn(
        "⚠️ Email não configurado. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD",
      );
    }
  }

  /**
   * Enviar email de confirmação de upgrade
   */
  async sendUpgradeConfirmation(
    email: string,
    estabelecimentoNome: string,
    preco: string = "R$ 49,90/mês",
  ) {
    this.ensureEmailConfigured();

    if (!transporter) {
      console.log(`📧 [SIMULADO] Email de confirmação enviado para ${email}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            .feature-list { list-style-position: inside; margin: 15px 0; }
            .feature-list li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao BarStock PRO!</h1>
            </div>
            <div class="content">
              <h2>Obrigado por fazer upgrade, ${estabelecimentoNome}!</h2>
              <p>Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos premium:</p>
              
              <ul class="feature-list">
                <li>✓ Produtos ilimitados</li>
                <li>✓ Usuários ilimitados</li>
                <li>✓ Movimentações ilimitadas</li>
                <li>✓ Dashboard completo com gráficos</li>
                <li>✓ Relatórios personalizados</li>
                <li>✓ Suporte prioritário</li>
                <li>✓ Backup automático</li>
                <li>✓ Acesso à API</li>
              </ul>

              <p><strong>Valor da assinatura:</strong> ${preco}</p>
              <p><strong>Data da próxima cobrança:</strong> Será informada em breve</p>

              <a href="https://app.barstock.com.br" class="button">Acessar Dashboard</a>

              <h3>O que fazer agora?</h3>
              <ol>
                <li>Configure seus produtos ilimitados</li>
                <li>Adicione mais usuários à sua equipe</li>
                <li>Explore os novos relatórios</li>
                <li>Configure integrações (se houver)</li>
              </ol>

              <p>Se tiver dúvidas, nossa equipe de suporte está pronta para ajudar!</p>
            </div>
            <div class="footer">
              <p>BarStock © 2026. Todos os direitos reservados.</p>
              <p><a href="https://barstock.com.br">Website</a> | <a href="mailto:support@barstock.com.br">Support</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "🎉 Bem-vindo ao BarStock PRO!",
        html: htmlContent,
      });

      console.log(`✅ Email de confirmação enviado para ${email}`);
    } catch (error: any) {
      console.error("❌ Erro ao enviar email de confirmação:", error.message);
    }
  }

  /**
   * Enviar email de downgrade automático
   */
  async sendDowngradeNotification(
    email: string,
    estabelecimentoNome: string,
    motivo: string = "Assinatura expirada",
  ) {
    this.ensureEmailConfigured();

    if (!transporter) {
      console.log(`📧 [SIMULADO] Email de downgrade enviado para ${email}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Plano reduzido para FREE</h1>
            </div>
            <div class="content">
              <h2>Oi ${estabelecimentoNome},</h2>
              <p>Sua assinatura PRO foi encerrada:</p>
              <p><strong>Motivo:</strong> ${motivo}</p>
              
              <p>Suas limitações agora são:</p>
              <ul>
                <li>⚠️ Máximo 50 produtos</li>
                <li>⚠️ Máximo 1 usuário</li>
                <li>⚠️ 100 movimentações por mês</li>
              </ul>

              <p>Você ainda tem acesso a todos os seus dados! Para continuar desfrutando dos recursos premium, faça upgrade novamente:</p>

              <a href="https://app.barstock.com.br/upgrade" class="button">Fazer Upgrade para PRO</a>

              <p>Se isso foi um engano ou você tem dúvidas, entre em contato:</p>
              <p><strong>Email:</strong> support@barstock.com.br</p>
            </div>
            <div class="footer">
              <p>BarStock © 2026. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "⚠️ Seu plano PRO foi encerrado",
        html: htmlContent,
      });

      console.log(`✅ Email de downgrade enviado para ${email}`);
    } catch (error: any) {
      console.error("❌ Erro ao enviar email de downgrade:", error.message);
    }
  }

  /**
   * Enviar relatório de uso mensal
   */
  async sendUsageReport(
    email: string,
    estabelecimentoNome: string,
    usage: {
      produtos: number;
      usuarios: number;
      movimentacoes: number;
      plano: "FREE" | "PRO";
    },
  ) {
    this.ensureEmailConfigured();

    if (!transporter) {
      console.log(`📧 [SIMULADO] Relatório de uso enviado para ${email}`);
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .stat { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .stat-label { color: #999; font-size: 12px; text-transform: uppercase; }
            .stat-value { font-size: 24px; font-weight: bold; color: #333; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Relatório de Uso Mensal</h1>
            </div>
            <div class="content">
              <h2>Olá ${estabelecimentoNome}!</h2>
              <p>Aqui está seu relatório de uso no mês:</p>
              
              <div class="stat">
                <div class="stat-label">Produtos Cadastrados</div>
                <div class="stat-value">${usage.produtos}</div>
              </div>

              <div class="stat">
                <div class="stat-label">Usuários Ativos</div>
                <div class="stat-value">${usage.usuarios}</div>
              </div>

              <div class="stat">
                <div class="stat-label">Movimentações (Este Mês)</div>
                <div class="stat-value">${usage.movimentacoes}</div>
              </div>

              <div class="stat">
                <div class="stat-label">Plano Atual</div>
                <div class="stat-value">${usage.plano}</div>
              </div>

              ${
                usage.plano === "FREE"
                  ? `
                <p style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px;">
                  <strong>💡 Dica:</strong> Seu plano FREE está com bom uso! Considere fazer upgrade para PRO para desfrutar de recursos ilimitados.
                </p>
              `
                  : `
                <p style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 4px;">
                  <strong>✨ Obrigado!</strong> Você está usando o máximo do seu plano PRO. Seus dados estão seguros!
                </p>
              `
              }
            </div>
            <div class="footer">
              <p>BarStock © 2026. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject: "📊 Seu Relatório de Uso - BarStock",
        html: htmlContent,
      });

      console.log(`✅ Relatório de uso enviado para ${email}`);
    } catch (error: any) {
      console.error("❌ Erro ao enviar relatório:", error.message);
    }
  }
}

export default new EmailService();
