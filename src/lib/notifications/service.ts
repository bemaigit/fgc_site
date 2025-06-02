import { prisma } from "@/lib/prisma"
import {
  NotificationData,
  NotificationChannel,
  NotificationResult,
  NotificationStatus,
  NotificationType,
  NotificationPriority
} from "./types"
import { EmailProvider } from "./providers/email"
import { WebhookProvider } from "./providers/webhook"
import { WhatsAppProvider } from "./providers/whatsapp"

export class NotificationService {
  private static instance: NotificationService
  private providers: Map<NotificationChannel, any>

  private constructor() {
    this.providers = new Map()
    this.providers.set(NotificationChannel.EMAIL, new EmailProvider())
    this.providers.set(NotificationChannel.WEBHOOK, new WebhookProvider())
    this.providers.set(NotificationChannel.WHATSAPP, new WhatsAppProvider())
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async send(notification: NotificationData): Promise<NotificationResult[]> {
    try {
      // Determinar canais de envio
      const channels = notification.channels || this.getDefaultChannels(notification.type)

      // Registrar notificação no banco
      const notificationRecord = await this.createNotificationRecord(notification)

      // Enviar para cada canal
      const results = await Promise.all(
        channels.map(async channel => {
          const provider = this.providers.get(channel)
          if (!provider) {
            return {
              success: false,
              channel,
              error: `Provider não encontrado para canal ${channel}`,
              timestamp: new Date()
            }
          }

          try {
            const result = await provider.send(notification)
            
            // Registrar tentativa
            await this.createNotificationAttempt(
              notificationRecord.id,
              result
            )

            return result
          } catch (error) {
            const failedResult = {
              success: false,
              channel,
              error: error instanceof Error ? error.message : "Erro desconhecido",
              timestamp: new Date()
            }

            // Registrar falha
            await this.createNotificationAttempt(
              notificationRecord.id,
              failedResult
            )

            return failedResult
          }
        })
      )

      // Atualizar status da notificação
      await this.updateNotificationStatus(
        notificationRecord.id,
        this.determineOverallStatus(results)
      )

      return results
    } catch (error) {
      console.error("Erro ao enviar notificação:", error)
      throw new Error("Falha ao processar notificação")
    }
  }

  public async getStatus(notificationId: string): Promise<NotificationStatus> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: { attempts: true }
    })

    if (!notification) {
      throw new Error("Notificação não encontrada")
    }

    return notification.status as NotificationStatus
  }

  private getDefaultChannels(type: NotificationType): NotificationChannel[] {
    // Configurar canais padrão por tipo de notificação
    const defaultChannels: Record<NotificationType, NotificationChannel[]> = {
      PAYMENT_CREATED: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      PAYMENT_APPROVED: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK, NotificationChannel.WHATSAPP],
      PAYMENT_FAILED: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      PAYMENT_EXPIRED: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      PAYMENT_REFUNDED: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
      PAYMENT_CHARGEBACK: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
      REGISTRATION_APPROVED: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP],
      REGISTRATION_EXPIRED: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP]
    }

    return defaultChannels[type] || [NotificationChannel.EMAIL]
  }

  private async createNotificationRecord(notification: NotificationData) {
    return prisma.notification.create({
      data: {
        type: notification.type,
        recipient: notification.recipient,
        data: notification.data,
        priority: notification.priority || NotificationPriority.MEDIUM,
        status: NotificationStatus.PENDING
      }
    })
  }

  private async createNotificationAttempt(
    notificationId: string,
    result: NotificationResult
  ) {
    return prisma.notificationAttempt.create({
      data: {
        notificationId,
        channel: result.channel,
        success: result.success,
        error: result.error,
        providerId: result.id
      }
    })
  }

  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status }
    })
  }

  private determineOverallStatus(results: NotificationResult[]): NotificationStatus {
    if (results.every(r => r.success)) {
      return NotificationStatus.SENT
    }
    if (results.some(r => r.success)) {
      return NotificationStatus.PARTIALLY_SENT
    }
    return NotificationStatus.FAILED
  }
}
