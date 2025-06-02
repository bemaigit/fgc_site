import { PaymentGatewayFactory } from "./factory"
import {
  CreatePaymentInput,
  PaymentResponse,
  PaymentStatus,
  RefundInput,
  RefundResponse,
  PaymentProvider,
  WebhookData
} from "./types"
import { prisma } from "@/lib/prisma"

export class PaymentService {
  private factory: PaymentGatewayFactory

  constructor() {
    this.factory = PaymentGatewayFactory.getInstance()
  }

  public async initialize(): Promise<void> {
    await this.factory.initialize()
  }

  public async createPayment(
    input: CreatePaymentInput,
    preferredProvider?: PaymentProvider
  ): Promise<PaymentResponse> {
    try {
      // Obter gateway apropriado
      const gateway = await this.factory.getGateway(preferredProvider)

      // Criar pagamento
      const response = await gateway.createPayment(input)

      // Registrar transação no banco
      await this.createTransaction({
        externalId: response.id,
        status: response.status,
        amount: input.amount,
        description: input.description,
        paymentMethod: input.paymentMethod,
        customerDocument: input.customer.document,
        metadata: {
          ...response.metadata,
          ...input.metadata
        }
      })

      return response
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      throw new Error("Falha ao processar pagamento")
    }
  }

  public async getPaymentStatus(
    paymentId: string,
    provider: PaymentProvider
  ): Promise<PaymentStatus> {
    try {
      const gateway = await this.factory.getGateway(provider)
      return await gateway.getPaymentStatus(paymentId)
    } catch (error) {
      console.error("Erro ao consultar status do pagamento:", error)
      throw new Error("Falha ao consultar status do pagamento")
    }
  }

  public async refundPayment(
    input: RefundInput,
    provider: PaymentProvider
  ): Promise<RefundResponse> {
    try {
      const gateway = await this.factory.getGateway(provider)
      const response = await gateway.refundPayment(input)

      // Registrar reembolso no banco
      await this.createRefund({
        transactionId: input.paymentId,
        amount: input.amount,
        reason: input.reason,
        status: response.status,
        metadata: response.metadata
      })

      return response
    } catch (error) {
      console.error("Erro ao realizar reembolso:", error)
      throw new Error("Falha ao processar reembolso")
    }
  }

  public async handleWebhook(
    provider: PaymentProvider,
    headers: Record<string, string>,
    body: any
  ): Promise<void> {
    try {
      const gateway = await this.factory.getGateway(provider)

      // Validar webhook
      const isValid = await gateway.validateWebhook(headers, body)
      if (!isValid) {
        throw new Error("Assinatura do webhook inválida")
      }

      // Processar webhook
      const webhookData = await gateway.processWebhook(body)

      // Atualizar status da transação
      await this.updateTransactionStatus(
        webhookData.paymentId,
        webhookData.status,
        webhookData.metadata
      )

      // Registrar webhook
      await this.logWebhook({
        provider,
        eventType: webhookData.type,
        paymentId: webhookData.paymentId,
        status: webhookData.status,
        rawData: body
      })
    } catch (error) {
      console.error("Erro ao processar webhook:", error)
      throw new Error("Falha ao processar notificação do gateway")
    }
  }

  private async createTransaction(data: {
    externalId: string
    status: PaymentStatus
    amount: number
    description: string
    paymentMethod: string
    customerDocument: string
    metadata?: Record<string, any>
  }) {
    return prisma.paymentTransaction.create({
      data: {
        externalId: data.externalId,
        status: data.status,
        amount: data.amount,
        description: data.description,
        paymentMethod: data.paymentMethod,
        customerDocument: data.customerDocument,
        metadata: data.metadata
      }
    })
  }

  private async createRefund(data: {
    transactionId: string
    amount?: number
    reason?: string
    status: PaymentStatus
    metadata?: Record<string, any>
  }) {
    return prisma.paymentRefund.create({
      data: {
        transactionId: data.transactionId,
        amount: data.amount,
        reason: data.reason,
        status: data.status,
        metadata: data.metadata
      }
    })
  }

  private async updateTransactionStatus(
    externalId: string,
    status: PaymentStatus,
    metadata?: Record<string, any>
  ) {
    return prisma.paymentTransaction.updateMany({
      where: { externalId },
      data: {
        status,
        metadata: metadata
          ? {
              ...metadata
            }
          : undefined,
        updatedAt: new Date()
      }
    })
  }

  private async logWebhook(data: {
    provider: PaymentProvider
    eventType: string
    paymentId: string
    status: PaymentStatus
    rawData: any
  }) {
    return prisma.paymentWebhookLog.create({
      data: {
        provider: data.provider,
        eventType: data.eventType,
        paymentId: data.paymentId,
        status: data.status,
        rawData: data.rawData
      }
    })
  }

  async getActiveGateway(): Promise<PaymentGateway | null> {
    try {
      const config = await prisma.gatewayConfig.findFirst({
        where: {
          active: true
        }
      })

      if (!config) {
        return null
      }

      const gateway = this.createGatewayInstance(config)
      if (!gateway) {
        return null
      }

      gateway.id = config.id
      gateway.name = config.name

      return gateway
    } catch (error) {
      console.error("Error getting active gateway:", error)
      return null
    }
  }
}
