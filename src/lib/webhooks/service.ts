import { PaymentProvider, PaymentStatus } from "@/lib/payment/types"
import { TransactionService } from "@/lib/transactions/service"
import { ProtocolService } from "@/lib/protocols/service"
import { NotificationService } from "@/lib/notifications/service"
import { MembershipService } from "@/lib/membership/service"

export class WebhookService {
  private static instance: WebhookService
  private transactionService: TransactionService
  private protocolService: ProtocolService
  private notificationService: NotificationService
  private membershipService: MembershipService

  private constructor() {
    this.transactionService = TransactionService.getInstance()
    this.protocolService = ProtocolService.getInstance()
    this.notificationService = NotificationService.getInstance()
    this.membershipService = MembershipService.getInstance()
  }

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService()
    }
    return WebhookService.instance
  }

  async handleWebhook(
    provider: PaymentProvider,
    data: any,
    signature?: string
  ) {
    try {
      // 1. Validar webhook com o gateway específico
      const gateway = await this.membershipService.getGateway(provider)
      const isValid = await gateway.validateWebhook(data, signature)
      
      if (!isValid) {
        throw new Error("Invalid webhook signature")
      }

      // 2. Extrair dados do webhook
      const {
        paymentId,
        status,
        metadata
      } = await gateway.parseWebhookData(data)

      // 3. Buscar transação
      const transaction = await this.transactionService
        .getTransactionByPaymentId(paymentId)

      if (!transaction) {
        throw new Error(`Transaction not found for payment ${paymentId}`)
      }

      // 4. Atualizar status da transação
      await this.transactionService.updateTransactionStatus(
        paymentId,
        status,
        metadata
      )

      // 5. Atualizar protocolo
      if (transaction.protocol) {
        await this.protocolService.updateProtocolStatus(
          transaction.protocol,
          status
        )
      }

      // 6. Processar ações específicas baseadas no tipo
      await this.processTypeSpecificActions(transaction.type, {
        paymentId,
        status,
        entityId: transaction.entityId,
        metadata
      })

      // 7. Enviar notificações
      await this.sendNotifications(transaction.type, {
        status,
        entityId: transaction.entityId,
        metadata
      })

      return { success: true }
    } catch (error) {
      console.error("Error processing webhook:", error)
      throw error
    }
  }

  private async processTypeSpecificActions(
    type: string,
    data: {
      paymentId: string
      status: PaymentStatus
      entityId: string
      metadata?: Record<string, any>
    }
  ) {
    switch (type) {
      case "MEMBERSHIP":
        if (data.status === PaymentStatus.PAID) {
          await this.membershipService.activateMembership(data.entityId)
        }
        break
      
      case "EVENT":
        // Implementar lógica específica de eventos
        break
      
      case "CLUB":
        // Implementar lógica específica de clubes
        break
    }
  }

  private async sendNotifications(
    type: string,
    data: {
      status: PaymentStatus
      entityId: string
      metadata?: Record<string, any>
    }
  ) {
    const notificationTypes = {
      MEMBERSHIP: {
        [PaymentStatus.PAID]: "MEMBERSHIP_PAYMENT_APPROVED",
        [PaymentStatus.FAILED]: "MEMBERSHIP_PAYMENT_FAILED",
        [PaymentStatus.EXPIRED]: "MEMBERSHIP_PAYMENT_EXPIRED"
      },
      EVENT: {
        [PaymentStatus.PAID]: "EVENT_PAYMENT_APPROVED",
        [PaymentStatus.FAILED]: "EVENT_PAYMENT_FAILED",
        [PaymentStatus.EXPIRED]: "EVENT_PAYMENT_EXPIRED"
      },
      CLUB: {
        [PaymentStatus.PAID]: "CLUB_PAYMENT_APPROVED",
        [PaymentStatus.FAILED]: "CLUB_PAYMENT_FAILED",
        [PaymentStatus.EXPIRED]: "CLUB_PAYMENT_EXPIRED"
      }
    }

    const notificationType = notificationTypes[type]?.[data.status]
    
    if (notificationType) {
      await this.notificationService.send({
        type: notificationType,
        entityId: data.entityId,
        data: data.metadata
      })
    }
  }
}
