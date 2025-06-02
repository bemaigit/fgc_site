export * from "./types"
export * from "./service"

import { NotificationService } from "./service"

// Instância global do serviço de notificações
export const notificationService = NotificationService.getInstance()

// Exemplo de uso:
/*
await notificationService.send({
  type: NotificationType.PAYMENT_CREATED,
  recipient: {
    name: "João Silva",
    email: "joao@email.com",
    webhookUrl: "https://webhook.site/123"
  },
  data: {
    amount: 100.00,
    description: "Filiação Anual",
    paymentMethod: "PIX",
    paymentUrl: "https://...",
    qrCode: "base64..."
  },
  priority: NotificationPriority.HIGH,
  channels: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK]
})
*/
