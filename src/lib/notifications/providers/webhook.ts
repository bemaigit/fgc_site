import axios from "axios"
import {
  NotificationProvider,
  NotificationData,
  NotificationResult,
  NotificationStatus,
  NotificationChannel
} from "../types"

export class WebhookProvider implements NotificationProvider {
  private readonly client = axios.create({
    timeout: 5000 // 5 segundos de timeout
  })

  async send(notification: NotificationData): Promise<NotificationResult> {
    try {
      if (!notification.recipient.webhookUrl) {
        throw new Error("URL do webhook não fornecida")
      }

      const payload = {
        type: notification.type,
        timestamp: new Date().toISOString(),
        data: notification.data
      }

      const response = await this.client.post(
        notification.recipient.webhookUrl,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-FGC-Signature": this.generateSignature(payload),
            "X-FGC-Event": notification.type
          }
        }
      )

      return {
        success: response.status >= 200 && response.status < 300,
        id: response.headers["x-request-id"] || new Date().getTime().toString(),
        channel: NotificationChannel.WEBHOOK,
        timestamp: new Date()
      }
    } catch (error) {
      console.error("Erro ao enviar webhook:", error)
      return {
        success: false,
        channel: NotificationChannel.WEBHOOK,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date()
      }
    }
  }

  async getStatus(notificationId: string): Promise<NotificationStatus> {
    // Webhooks são fire-and-forget, então consideramos enviado após o envio
    return NotificationStatus.SENT
  }

  private generateSignature(payload: any): string {
    const crypto = require("crypto")
    const secret = process.env.WEBHOOK_SECRET || ""
    
    return crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex")
  }
}
