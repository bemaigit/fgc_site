import axios from "axios"
import {
  NotificationProvider,
  NotificationData,
  NotificationResult,
  NotificationStatus,
  NotificationChannel,
  NotificationType
} from "../types"

interface WhatsAppTemplate {
  name: string
  language: string
  components: {
    type: "header" | "body" | "button"
    parameters: Array<{
      type: "text" | "currency" | "date_time" | "image"
      text?: string
      currency?: {
        fallback_value: string
        code: string
        amount_1000: number
      }
      date_time?: {
        fallback_value: string
      }
      image?: {
        link: string
      }
    }>
  }[]
}

export class WhatsAppProvider implements NotificationProvider {
  private client = axios.create({
    baseURL: "https://graph.facebook.com/v19.0",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    }
  })

  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  private readonly businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

  async send(notification: NotificationData): Promise<NotificationResult> {
    try {
      if (!notification.recipient.phone) {
        throw new Error("Número de telefone não fornecido")
      }

      // Formatar número de telefone (remover caracteres não numéricos)
      const phone = notification.recipient.phone.replace(/\D/g, "")

      // Obter template apropriado para o tipo de notificação
      const template = this.getTemplate(notification)

      // Enviar mensagem
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template
        }
      )

      return {
        success: true,
        id: response.data.messages?.[0]?.id,
        channel: NotificationChannel.WHATSAPP,
        timestamp: new Date()
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem WhatsApp:", error)
      return {
        success: false,
        channel: NotificationChannel.WHATSAPP,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date()
      }
    }
  }

  async getStatus(notificationId: string): Promise<NotificationStatus> {
    try {
      const response = await this.client.get(
        `/${this.businessAccountId}/message_status?message_id=${notificationId}`
      )

      const status = response.data.status
      switch (status) {
        case "sent":
          return NotificationStatus.SENT
        case "delivered":
          return NotificationStatus.DELIVERED
        case "read":
          return NotificationStatus.DELIVERED
        case "failed":
          return NotificationStatus.FAILED
        default:
          return NotificationStatus.PENDING
      }
    } catch (error) {
      console.error("Erro ao consultar status WhatsApp:", error)
      throw new Error("Falha ao consultar status da mensagem")
    }
  }

  private getTemplate(notification: NotificationData): WhatsAppTemplate {
    switch (notification.type) {
      case NotificationType.PAYMENT_CREATED:
        return {
          name: "payment_created",
          language: "pt_BR",
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: notification.recipient.name
                }
              ]
            },
            {
              type: "body",
              parameters: [
                {
                  type: "currency",
                  currency: {
                    fallback_value: notification.data.amount,
                    code: "BRL",
                    amount_1000: parseFloat(notification.data.amount) * 1000
                  }
                },
                {
                  type: "text",
                  text: notification.data.description
                },
                {
                  type: "text",
                  text: notification.data.paymentMethod
                }
              ]
            }
          ]
        }

      case NotificationType.PAYMENT_APPROVED:
        return {
          name: "payment_approved",
          language: "pt_BR",
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: notification.recipient.name
                }
              ]
            },
            {
              type: "body",
              parameters: [
                {
                  type: "currency",
                  currency: {
                    fallback_value: notification.data.amount,
                    code: "BRL",
                    amount_1000: parseFloat(notification.data.amount) * 1000
                  }
                },
                {
                  type: "text",
                  text: notification.data.description
                },
                {
                  type: "date_time",
                  date_time: {
                    fallback_value: notification.data.approvalDate
                  }
                }
              ]
            }
          ]
        }

      case NotificationType.REGISTRATION_APPROVED:
        return {
          name: "registration_approved",
          language: "pt_BR",
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: notification.recipient.name
                }
              ]
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: notification.data.category
                },
                {
                  type: "date_time",
                  date_time: {
                    fallback_value: notification.data.expiryDate
                  }
                }
              ]
            }
          ]
        }

      default:
        throw new Error(`Template não encontrado para ${notification.type}`)
    }
  }
}
