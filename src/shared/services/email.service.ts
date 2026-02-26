import nodemailer from "nodemailer";
import { Resend } from "resend";

// Configurações Resend (produção - mais confiável)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Configurações SMTP (fallback)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@barstock.com.br";

// Transporter Nodemailer (fallback)
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

/**
 * Determina o provedor de email disponível
 * Prioridade: Resend > SMTP (Nodemailer) > Simulado
 */
const getEmailProvider = (): "resend" | "smtp" | "simulated" => {
  if (resend) return "resend";
  if (transporter) return "smtp";
  return "simulated";
};

export class EmailService {
  /**
   * Enviar email de verificação de email
   * Usa Resend (produção), fallback para SMTP
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
        .button { 
          display: inline-block; 
          background: #4f46e5; 
          color: white; 
          padding: 12px 30px; 
          border-radius: 6px; 
          text-decoration: none; 
          font-weight: 600;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
        .expires { font-size: 13px; color: #666; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: #1f2937; margin: 0;">Verifique seu Email</h2>
        </div>
        
        <div class="content">
          <p>Olá,</p>
          <p>Clique no botão abaixo para verificar seu endereço de email e ativar sua conta:</p>
          
          <center>
            <a href="${verificationLink}" class="button">Verificar Email</a>
          </center>
          
          <p style="text-align: center; font-size: 14px; color: #666;">
            Ou copie este link:
            <br/>
            <code style="background: #fff; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all;">
              ${verificationLink}
            </code>
          </p>
          
          <div class="expires">
            ⏰ Este link expira em 1 hora.
          </div>
        </div>
        
        <div class="footer">
          <p>Se você não solicitou este email, ignore-o com segurança.</p>
          <p>© 2026 BarStock. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const provider = getEmailProvider();

    try {
      if (resend) {
        // Usar Resend em produção
        const result = await resend.emails.send({
          from: SMTP_FROM,
          to: email,
          subject: "Verifique seu Email - BarStock",
          html: htmlContent,
        });

        if (result.error) {
          console.error("❌ Erro ao enviar email via Resend:", result.error);
          // Fallback para SMTP se Resend falhar
          await this.sendViaSmtp(
            email,
            "Verifique seu Email - BarStock",
            htmlContent,
          );
        } else {
          console.log(
            `✅ Email de verificação enviado via Resend para ${email}`,
          );
        }
      } else if (transporter) {
        // Fallback para SMTP
        await this.sendViaSmtp(
          email,
          "Verifique seu Email - BarStock",
          htmlContent,
        );
      } else {
        // Simulado (desenvolvimento sem email configurado)
        console.log(`📧 [SIMULADO] Email de verificação enviado para ${email}`);
      }
    } catch (error: any) {
      console.error("❌ Erro ao enviar email de verificação:", error.message);
      // Não lançar erro - permitir que a aplicação continue
    }
  }

  /**
   * Enviar email de reset de senha
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
        .button { 
          display: inline-block; 
          background: #4f46e5; 
          color: white; 
          padding: 12px 30px; 
          border-radius: 6px; 
          text-decoration: none; 
          font-weight: 600;
          margin: 20px 0;
        }
        .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
        .expires { font-size: 13px; color: #dc2626; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: #1f2937; margin: 0;">Redefinir Senha</h2>
        </div>
        
        <div class="content">
          <p>Recebemos um pedido para redefinir sua senha.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          
          <center>
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </center>
          
          <p style="text-align: center; font-size: 14px; color: #666;">
            Ou copie este link:
            <br/>
            <code style="background: #fff; padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px; word-break: break-all;">
              ${resetLink}
            </code>
          </p>
          
          <div class="expires">
            ⏰ Este link expira em 15 minutos. Por segurança, não compartilhe este link.
          </div>
        </div>
        
        <div class="footer">
          <p>Se você não solicitou esta redefinição, ignore este email com segurança.</p>
          <p>© 2026 BarStock. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      if (resend) {
        // Usar Resend em produção
        const result = await resend.emails.send({
          from: SMTP_FROM,
          to: email,
          subject: "Redefinir sua Senha - BarStock",
          html: htmlContent,
        });

        if (result.error) {
          console.error("❌ Erro ao enviar email via Resend:", result.error);
          // Fallback para SMTP se Resend falhar
          await this.sendViaSmtp(
            email,
            "Redefinir sua Senha - BarStock",
            htmlContent,
          );
        } else {
          console.log(`✅ Email de reset enviado via Resend para ${email}`);
        }
      } else if (transporter) {
        // Fallback para SMTP
        await this.sendViaSmtp(
          email,
          "Redefinir sua Senha - BarStock",
          htmlContent,
        );
      } else {
        // Simulado (desenvolvimento sem email configurado)
        console.log(`📧 [SIMULADO] Email de reset enviado para ${email}`);
      }
    } catch (error: any) {
      console.error("❌ Erro ao enviar email de reset:", error.message);
      // Não lançar erro - permitir que a aplicação continue
    }
  }

  /**
   * Enviar email via SMTP (fallback)
   */
  private async sendViaSmtp(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!transporter) {
      throw new Error("SMTP não configurado");
    }

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
      });
      console.log(`✅ Email enviado via SMTP para ${to}`);
    } catch (error: any) {
      console.error("❌ Erro ao enviar email via SMTP:", error.message);
      throw error;
    }
  }

  /**
   * Enviar email de confirmação de upgrade
   * (Mantido para compatibilidade com código legado)
   */
  async sendUpgradeConfirmation(
    email: string,
    estabelecimentoNome: string,
    preco: string = "R$ 29,90/mês",
  ) {
    if (!resend && !transporter) {
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
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      if (resend) {
        await resend.emails.send({
          from: SMTP_FROM,
          to: email,
          subject: "🎉 Bem-vindo ao BarStock PRO!",
          html: htmlContent,
        });
      } else {
        await this.sendViaSmtp(
          email,
          "🎉 Bem-vindo ao BarStock PRO!",
          htmlContent,
        );
      }
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
    if (!resend && !transporter) {
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
      if (resend) {
        await resend.emails.send({
          from: SMTP_FROM,
          to: email,
          subject: "⚠️ Seu plano PRO foi encerrado",
          html: htmlContent,
        });
      } else {
        await this.sendViaSmtp(
          email,
          "⚠️ Seu plano PRO foi encerrado",
          htmlContent,
        );
      }
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
    if (!resend && !transporter) {
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
      if (resend) {
        await resend.emails.send({
          from: SMTP_FROM,
          to: email,
          subject: "📊 Seu Relatório de Uso - BarStock",
          html: htmlContent,
        });
      } else {
        await this.sendViaSmtp(
          email,
          "📊 Seu Relatório de Uso - BarStock",
          htmlContent,
        );
      }
    } catch (error: any) {
      console.error("❌ Erro ao enviar relatório:", error.message);
    }
  }
}

export default new EmailService();
