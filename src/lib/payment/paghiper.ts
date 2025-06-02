import axios, { AxiosInstance } from "axios"
import {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
  WebhookData,
  EntityType,
  TransactionType
} from "./types"

interface PagHiperCredentials {
  apiKey: string
  token: string
}

interface PagHiperWebhookEvent {
  transaction_id: string
  status: string
  order_id: string
  value_cents: number
  value_payment: number
}

export class PagHiperGateway implements PaymentGateway {
  private client: AxiosInstance
  private credentials: PagHiperCredentials

  constructor(credentials: PagHiperCredentials) {
    this.credentials = credentials
    this.client = axios.create({
      baseURL: "https://api.paghiper.com",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "apiKey": this.credentials.apiKey
      }
    })
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      const payload = {
        apiKey: this.credentials.apiKey,
        order_id: input.metadata.referenceCode || Date.now().toString(),
        payer_email: input.customer.email,
        payer_name: input.customer.name,
        payer_cpf_cnpj: input.customer.document,
        payer_phone: input.customer.phone,
        type_bank_slip: input.paymentMethod === PaymentMethod.PIX ? "pix" : "billet",
        days_due_date: 3,
        items: [{
          description: input.description,
          quantity: 1,
          item_value: input.amount
        }],
        notification_url: input.notificationUrl
      }

      const response = await this.client.post("/transaction/create/", payload)

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao criar pagamento")
      }

      const { transaction_id, value_cents, bank_slip } = response.data.create_request

      return {
        id: transaction_id,
        status: PaymentStatus.PENDING,
        amount: value_cents / 100,
        paymentUrl: bank_slip.url_slip,
        qrCode: bank_slip.qrcode_image_url,
        barcodeNumber: bank_slip.digitable_line,
        metadata: {
          ...input.metadata,
          gatewayId: transaction_id
        }
      }
    } catch (error) {
      console.error("PagHiper createPayment error:", error)
      throw new Error("Erro ao criar pagamento no PagHiper")
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.post("/transaction/status/", {
        apiKey: this.credentials.apiKey,
        token: this.credentials.token,
        transaction_id: paymentId
      })

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao consultar status")
      }

      return this.mapStatus(response.data.status)
    } catch (error) {
      console.error("PagHiper getPaymentStatus error:", error)
      throw new Error("Erro ao consultar status do pagamento no PagHiper")
    }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await this.client.post("/transaction/refund/", {
        apiKey: this.credentials.apiKey,
        token: this.credentials.token,
        transaction_id: paymentId,
        refund_type: "full"
      })

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao realizar reembolso")
      }

      return {
        id: paymentId,
        status: PaymentStatus.REFUNDED,
        amount: response.data.refund.value_cents / 100,
        metadata: {
          type: TransactionType.OTHER,
          entityId: response.data.order_id,
          entityType: EntityType.ATHLETE,
          gatewayId: paymentId
        }
      }
    } catch (error) {
      console.error("PagHiper refundPayment error:", error)
      throw new Error("Erro ao realizar reembolso no PagHiper")
    }
  }

  async validateWebhook(
    _headers: Record<string, string>,
    data: unknown
  ): Promise<boolean> {
    // PagHiper não fornece validação de assinatura
    // A validação é feita pelo token na notificação
    if (typeof data === 'object' && data && 'token' in data) {
      return (data as { token: string }).token === this.credentials.token
    }
    return false
  }

  async parseWebhookData(data: PagHiperWebhookEvent): Promise<WebhookData> {
    return {
      paymentId: data.transaction_id,
      status: this.mapStatus(data.status),
      metadata: {
        orderId: data.order_id,
        valueCents: data.value_cents,
        valuePayment: data.value_payment
      }
    }
  }

  private mapStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      reserved: PaymentStatus.PROCESSING,
      paid: PaymentStatus.PAID,
      completed: PaymentStatus.PAID,
      refunded: PaymentStatus.REFUNDED,
      canceled: PaymentStatus.CANCELED,
      processing: PaymentStatus.PROCESSING,
      expired: PaymentStatus.EXPIRED
    }

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING
  }
}
