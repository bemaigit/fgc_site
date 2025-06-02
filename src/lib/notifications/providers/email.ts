import nodemailer from "nodemailer"
import handlebars from "handlebars"
import { promises as fs } from "fs"
import path from "path"
import {
  NotificationProvider,
  NotificationData,
  NotificationResult,
  NotificationStatus,
  NotificationChannel
} from "../types"

export class EmailProvider implements NotificationProvider {
  private transporter: nodemailer.Transporter
  private templatesDir: string

  constructor() {
    // Configurar transporter do Nodemailer
    const transporterConfig: any = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
    };

    // Adicionar autenticação apenas se houver credenciais
    if (process.env.SMTP_USER && process.env.SMTP_USER.trim() !== '') {
      transporterConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      };
    }

    this.transporter = nodemailer.createTransport(transporterConfig);

    // Diretório de templates
    this.templatesDir = path.join(process.cwd(), "src/lib/notifications/templates/email")
  }

  async send(notification: NotificationData): Promise<NotificationResult> {
    try {
      if (!notification.recipient.email) {
        throw new Error("Email do destinatário não fornecido")
      }

      // Carregar template
      const template = await this.loadTemplate(notification.type)
      if (!template) {
        throw new Error(`Template não encontrado para ${notification.type}`)
      }

      // Compilar template com dados
      const compiledHtml = this.compileTemplate(template, {
        ...notification.data,
        year: new Date().getFullYear(),
        logoUrl: process.env.NEXT_PUBLIC_LOGO_URL
      })

      // Enviar email
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: notification.recipient.email,
        subject: this.getSubject(notification),
        html: compiledHtml
      })

      return {
        success: true,
        id: info.messageId,
        channel: NotificationChannel.EMAIL,
        timestamp: new Date()
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date()
      }
    }
  }

  async getStatus(notificationId: string): Promise<NotificationStatus> {
    // Implementação básica - poderia ser melhorada com integração
    // com serviços de rastreamento de email
    return NotificationStatus.SENT
  }

  private async loadTemplate(type: string): Promise<string> {
    const templatePath = path.join(
      this.templatesDir,
      `${type.toLowerCase()}.hbs`
    )
    
    try {
      return await fs.readFile(templatePath, "utf-8")
    } catch (error) {
      console.error(`Erro ao carregar template ${templatePath}:`, error)
      throw new Error(`Template ${type} não encontrado`)
    }
  }

  private compileTemplate(template: string, data: any): string {
    try {
      const compiledTemplate = handlebars.compile(template)
      return compiledTemplate(data)
    } catch (error) {
      console.error("Erro ao compilar template:", error)
      throw new Error("Erro ao compilar template")
    }
  }

  private getSubject(notification: NotificationData): string {
    const subjectMap: Record<string, string> = {
      PAYMENT_CREATED: "Confirmação de Pagamento - Federação Goiana de Ciclismo",
      PAYMENT_APPROVED: "Pagamento Aprovado - Federação Goiana de Ciclismo",
      PAYMENT_FAILED: "Falha no Pagamento - Federação Goiana de Ciclismo",
      'password-reset': "Recuperação de Senha - Federação Goiana de Ciclismo",
      'email-verification': "Confirme seu Email - Federação Goiana de Ciclismo",
      'event-registration': "Confirmação de Inscrição em Evento - Federação Goiana de Ciclismo",
      'membership-confirmation': "Filiação Confirmada - Federação Goiana de Ciclismo",
      'MEMBERSHIP_ACTIVATED': "Filiação Confirmada - Federação Goiana de Ciclismo"
    }

    return subjectMap[notification.type] || "Notificação - Federação Goiana de Ciclismo"
  }
}
