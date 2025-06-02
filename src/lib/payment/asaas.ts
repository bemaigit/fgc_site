import axios, { AxiosInstance } from "axios"
import {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
  WebhookData
} from "./types"

interface AsaasCredentials {
  accessToken: string
}

interface AsaasWebhookEvent {
  payment: {
    id: string
    status: string
    customer: string
    billingType: string
    value: number
    netValue: number
    description: string
    invoiceUrl?: string
    dueDate: string
  }
}

export class AsaasGateway implements PaymentGateway {
  private client: AxiosInstance
  private accessToken: string
  private isSandbox: boolean

  constructor(credentials: AsaasCredentials, sandbox = false) {
    this.accessToken = credentials.accessToken
    this.isSandbox = sandbox
    this.client = axios.create({
      baseURL: this.getBaseUrl(),
      headers: {
        access_token: this.accessToken,
        "Content-Type": "application/json"
      }
    })
  }

  private getBaseUrl(): string {
    return this.isSandbox
      ? "https://sandbox.asaas.com/api/v3"
      : "https://www.asaas.com/api/v3"
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      // Primeiro, criar ou atualizar o cliente
      const customer = await this.createOrUpdateCustomer(input)

      // Criar o pagamento
      const paymentPayload = this.buildPaymentPayload(input, customer.id)
      const response = await this.client.post("/payments", paymentPayload)

      return {
        id: response.data.id,
        status: this.mapStatus(response.data.status),
        amount: response.data.value,
        paymentUrl: response.data.invoiceUrl,
        qrCode: response.data.pixQrCode,
        qrCodeBase64: response.data.pixQrCodeBase64,
        barcodeNumber: response.data.bankSlipNumber,
        expiresAt: response.data.dueDate ? new Date(response.data.dueDate) : undefined,
        metadata: {
          ...input.metadata,
          gatewayId: response.data.id,
          customerId: customer.id,
          paymentType: response.data.billingType
        }
      }
    } catch (error) {
      console.error("Asaas createPayment error:", error)
      throw new Error("Erro ao criar pagamento no Asaas")
    }
  }

  private async createOrUpdateCustomer(input: CreatePaymentInput) {
    const customerPayload = {
      name: input.customer.name,
      email: input.customer.email,
      cpfCnpj: input.customer.document,
      phone: input.customer.phone,
      mobilePhone: input.customer.phone,
      address: input.customer.address?.street,
      city: input.customer.address?.city,
      state: input.customer.address?.state,
      postalCode: input.customer.address?.zipCode
    }

    try {
      // Tentar encontrar cliente existente por CPF/CNPJ
      const customers = await this.client.get(
        `/customers?cpfCnpj=${input.customer.document}`
      )

      if (customers.data.data.length > 0) {
        // Atualizar cliente existente
        const customerId = customers.data.data[0].id
        const response = await this.client.put(
          `/customers/${customerId}`,
          customerPayload
        )
        return response.data
      } else {
        // Criar novo cliente
        const response = await this.client.post("/customers", customerPayload)
        return response.data
      }
    } catch (error) {
      console.error("Asaas createOrUpdateCustomer error:", error)
      throw new Error("Erro ao criar/atualizar cliente no Asaas")
    }
  }

  private buildPaymentPayload(input: CreatePaymentInput, customerId: string) {
    const basePayload = {
      customer: customerId,
      billingType: this.mapPaymentMethod(input.paymentMethod),
      value: input.amount,
      description: input.description,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
    }

    switch (input.paymentMethod) {
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return {
          ...basePayload,
          installmentCount: 1,
          installmentValue: input.amount
        }

      case PaymentMethod.PIX:
        return {
          ...basePayload,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 dia
        }

      case PaymentMethod.BOLETO:
        return {
          ...basePayload,
          description: `${input.description}\nNão receber após o vencimento`
        }

      default:
        return basePayload
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
      const response = await this.client.get(`/payments/${paymentId}`)
      return this.mapStatus(response.data.status)
    } catch (error) {
      console.error("Asaas getPaymentStatus error:", error)
      throw new Error("Erro ao consultar status do pagamento no Asaas")
    }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await this.client.post(`/payments/${paymentId}/refund`)
      const payment = await this.getPaymentDetails(paymentId)

      return {
        id: response.data.id,
        status: PaymentStatus.REFUNDED,
        amount: response.data.value,
        metadata: {
          type: payment.metadata.type,
          entityId: payment.metadata.entityId,
          entityType: payment.metadata.entityType,
          gatewayId: paymentId,
          customerId: payment.customer,
          paymentType: payment.billingType
        }
      }
    } catch (error) {
      console.error("Asaas refundPayment error:", error)
      throw new Error("Erro ao realizar reembolso no Asaas")
    }
  }

  async validateWebhook(_headers: Record<string, string>): Promise<boolean> {
    // Asaas não fornece validação de webhook por assinatura
    // A validação é feita pelo IP de origem
    return true
  }

  async parseWebhookData(data: AsaasWebhookEvent): Promise<WebhookData> {
    try {
      const paymentId = data.payment.id
      if (!paymentId) {
        throw new Error("ID do pagamento não encontrado no webhook")
      }

      const payment = await this.getPaymentDetails(paymentId)

      return {
        paymentId: paymentId,
        status: this.mapStatus(payment.status),
        metadata: {
          type: payment.metadata.type,
          entityId: payment.metadata.entityId,
          entityType: payment.metadata.entityType,
          gatewayId: paymentId,
          customerId: payment.customer,
          paymentType: payment.billingType
        }
      }
    } catch (error) {
      console.error("Asaas processWebhook error:", error)
      throw new Error("Erro ao processar webhook do Asaas")
    }
  }

  private async getPaymentDetails(paymentId: string) {
    const response = await this.client.get(`/payments/${paymentId}`)
    return response.data
  }

  private mapStatus(asaasStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PENDING: PaymentStatus.PENDING,
      RECEIVED: PaymentStatus.PAID,
      CONFIRMED: PaymentStatus.PAID,
      OVERDUE: PaymentStatus.FAILED,
      REFUNDED: PaymentStatus.REFUNDED,
      RECEIVED_IN_CASH: PaymentStatus.PAID,
      REFUND_REQUESTED: PaymentStatus.PROCESSING,
      CHARGEBACK_REQUESTED: PaymentStatus.PROCESSING,
      CHARGEBACK_DISPUTE: PaymentStatus.PROCESSING,
      AWAITING_CHARGEBACK_REVERSAL: PaymentStatus.PROCESSING,
      DUNNING_REQUESTED: PaymentStatus.FAILED,
      DUNNING_RECEIVED: PaymentStatus.PAID,
      AWAITING_RISK_ANALYSIS: PaymentStatus.PROCESSING
    }

    return statusMap[asaasStatus] || PaymentStatus.PENDING
  }
}
