import { 
  PaymentGateway, 
  CreatePaymentInput, 
  PaymentResult, 
  PaymentStatus,
  PaymentGatewayConfig,
  WebhookData
} from "@/lib/payment/types"

export abstract class BasePaymentGateway implements PaymentGateway {
  // Unique identifier and display name
  abstract readonly id: string
  abstract readonly name: string
  // Aliases for card-based payments
  abstract createPaymentWithCard(input: any): Promise<any>
  abstract processCardPayment(input: any): Promise<any>
  abstract getInstallmentOptions(amount: number, paymentMethodId?: string): Promise<any[]>

  protected config: PaymentGatewayConfig

  constructor(config: PaymentGatewayConfig) {
    this.config = config
  }

  createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    throw new Error("Method not implemented.");
  }

  getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    throw new Error("Method not implemented.");
  }

  refundPayment(paymentId: string): Promise<PaymentResult> {
    throw new Error("Method not implemented.");
  }

  validateWebhook(data: any, signature?: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // Parse generic webhook data into standard WebhookData shape
  async parseWebhookData(data: any): Promise<WebhookData> {
    // Default implementation: override in specific gateways
    return {
      id: data.id as string,
      type: data.type || '',
      provider: data.provider || '',
      status: data.status as PaymentStatus,
      amount: data.amount as number,
      metadata: data.metadata,
      gatewayData: data
    }
  }

  protected validateConfig() {
    if (!this.config?.credentials) {
      throw new Error("Credenciais do gateway não configuradas")
    }
  }

  protected async handleApiError(error: any): Promise<never> {
    console.error("Erro na API do gateway:", error)
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      "Erro ao processar pagamento"
    )
  }
}
