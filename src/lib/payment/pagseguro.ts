import axios, { AxiosInstance } from "axios"
import crypto from "crypto"
import {
  CreatePaymentInput,
  PaymentGateway,
  PaymentMethod,
  PaymentResult,
  PaymentStatus,
  WebhookData,
  EntityType,
  TransactionType
} from "./types"

interface PagSeguroCredentials {
  token: string
  appKey: string
  appId: string
}

interface PagSeguroGatewayConfig {
  credentials: PagSeguroCredentials
  sandbox?: boolean
}

interface PagSeguroWebhookEvent {
  charge: {
    id: string
    status: string
    payment_method: {
      type: string
    }
  }
}

interface CardPaymentInput {
  id: string
  cardToken: string
  installments: number
  holderName: string
  expiryMonth: string
  expiryYear: string
}

export class PagSeguroGateway implements PaymentGateway {
  private client: AxiosInstance
  private credentials: PagSeguroCredentials
  private isSandbox: boolean

  constructor(config: PagSeguroGatewayConfig) {
    this.credentials = config.credentials
    this.isSandbox = config.sandbox || false
    this.client = axios.create({
      baseURL: this.getBaseUrl(),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.credentials.token}`
      }
    })
  }

  private getBaseUrl(): string {
    return this.isSandbox
      ? "https://sandbox.api.pagseguro.com"
      : "https://api.pagseguro.com"
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      const payload = {
        reference_id: input.metadata.referenceCode || Date.now().toString(),
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          tax_id: input.customer.document,
          phones: [
            {
              country: "55",
              number: input.customer.phone?.replace(/\D/g, "")
            }
          ]
        },
        items: [
          {
            reference_id: "1",
            name: input.description,
            quantity: 1,
            unit_amount: input.amount * 100
          }
        ],
        payment_method: {
          type: this.mapPaymentMethod(input.paymentMethod),
          installments: input.cardData?.installments || 1,
          capture: true
        },
        notification_urls: [input.notificationUrl],
        ...this.getPaymentMethodSpecificConfig(input.paymentMethod)
      }

      const response = await this.client.post("/charges", payload)

      return {
        id: response.data.id,
        status: this.mapStatus(response.data.status),
        amount: response.data.amount.value / 100,
        paymentUrl: response.data.payment_url,
        qrCode: response.data.qr_codes?.[0]?.text,
        qrCodeBase64: response.data.qr_codes?.[0]?.links?.images?.png,
        barcodeNumber: response.data.payment_method?.boleto?.barcode,
        metadata: {
          ...input.metadata,
          gatewayId: response.data.id
        }
      }
    } catch (error) {
      console.error("PagSeguro createPayment error:", error)
      throw new Error("Erro ao criar pagamento no PagSeguro")
    }
  }

  private getPaymentMethodSpecificConfig(method: PaymentMethod): Record<string, unknown> {
    switch (method) {
      case PaymentMethod.PIX:
        return {
          qr_codes: [{ expiration_date: "2024-12-31T23:59:59-03:00" }]
        }
      case PaymentMethod.BOLETO:
        return {
          payment_method: {
            boleto: {
              due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              instruction_lines: {
                line_1: "Pagamento processado para DESC Fatura",
                line_2: "Via PagSeguro"
              }
            }
          }
        }
      default:
        return {}
    }
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
      [PaymentMethod.CREDIT_CARD]: "CREDIT_CARD",
      [PaymentMethod.DEBIT_CARD]: "DEBIT_CARD",
      [PaymentMethod.PIX]: "PIX",
      [PaymentMethod.BOLETO]: "BOLETO"
    }

    return methodMap[method]
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/charges/${paymentId}`)
      return this.mapStatus(response.data.status)
    } catch (error) {
      console.error("PagSeguro getPaymentStatus error:", error)
      throw new Error("Erro ao consultar status do pagamento no PagSeguro")
    }
  }

  async processCardPayment(input: CardPaymentInput): Promise<PaymentResult> {
    try {
      // Buscar a transação atual
      const response = await this.client.get(`/charges/${input.id}`)
      
      // Verificar se a transação está pendente
      if (response.data.status !== 'WAITING' && response.data.status !== 'PENDING') {
        return {
          id: input.id,
          status: this.mapStatus(response.data.status),
          amount: response.data.amount.value / 100,
          metadata: {
            gatewayId: input.id
          }
        }
      }
      
      // Atualizar a transação com os dados do cartão
      const payload = {
        payment_method: {
          type: "CREDIT_CARD",
          installments: input.installments,
          capture: true,
          card: {
            encrypted: input.cardToken,
            holder: {
              name: input.holderName
            },
            security_code: "123", // Em produção, seria o CVV real
            expiration_month: input.expiryMonth,
            expiration_year: input.expiryYear
          }
        }
      }
      
      const updateResponse = await this.client.put(`/charges/${input.id}`, payload)
      
      return {
        id: updateResponse.data.id,
        status: this.mapStatus(updateResponse.data.status),
        amount: updateResponse.data.amount.value / 100,
        metadata: {
          gatewayId: updateResponse.data.id
        }
      }
    } catch (error) {
      console.error("PagSeguro processCardPayment error:", error)
      throw new Error("Erro ao processar pagamento com cartão no PagSeguro")
    }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const payment = await this.client.get(`/charges/${paymentId}`)
      const cancelResponse = await this.client.post(`/charges/${paymentId}/cancel`)

      return {
        id: paymentId,
        status: this.mapStatus(cancelResponse.data.status),
        amount: payment.data.amount.value / 100,
        metadata: {
          type: payment.data.metadata?.type || TransactionType.OTHER,
          entityId: payment.data.metadata?.entityId || payment.data.reference_id,
          entityType: payment.data.metadata?.entityType || EntityType.ATHLETE,
          gatewayId: paymentId
        }
      }
    } catch (error) {
      console.error("PagSeguro refundPayment error:", error)
      throw new Error("Erro ao realizar reembolso no PagSeguro")
    }
  }

  async validateWebhook(
    headers: Record<string, string>,
    body: unknown
  ): Promise<boolean> {
    try {
      const signature = headers["x-api-signature"]
      if (!signature) return false

      const payload = typeof body === "string" ? body : JSON.stringify(body)
      const hash = crypto
        .createHmac("sha256", this.credentials.appKey)
        .update(payload)
        .digest("hex")

      return signature === hash
    } catch (error) {
      console.error("PagSeguro validateWebhook error:", error)
      return false
    }
  }

  async parseWebhookData(data: PagSeguroWebhookEvent): Promise<WebhookData> {
    try {
      const payment = await this.client.get(`/charges/${data.charge.id}`)

      return {
        paymentId: data.charge.id,
        status: this.mapStatus(data.charge.status),
        metadata: {
          type: payment.data.metadata?.type || TransactionType.OTHER,
          entityId: payment.data.metadata?.entityId || payment.data.reference_id,
          entityType: payment.data.metadata?.entityType || EntityType.ATHLETE,
          gatewayId: data.charge.id,
          paymentType: data.charge.payment_method.type
        }
      }
    } catch (error) {
      console.error("PagSeguro parseWebhookData error:", error)
      throw new Error("Erro ao processar webhook do PagSeguro")
    }
  }

  private mapStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      AUTHORIZED: PaymentStatus.PROCESSING,
      PAID: PaymentStatus.PAID,
      IN_ANALYSIS: PaymentStatus.PROCESSING,
      PENDING: PaymentStatus.PENDING,
      WAITING: PaymentStatus.PENDING,
      REFUSED: PaymentStatus.FAILED,
      REFUNDED: PaymentStatus.REFUNDED,
      CHARGEBACK: PaymentStatus.REFUNDED,
      CANCELED: PaymentStatus.CANCELED,
      EXPIRED: PaymentStatus.EXPIRED
    }

    return statusMap[status] || PaymentStatus.PENDING
  }
}
