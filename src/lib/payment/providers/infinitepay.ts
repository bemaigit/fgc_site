import { PaymentProvider } from "../types"
import { BasePaymentProvider } from "./base"
import { CreatePaymentData, PaymentStatus } from "../types"

export class InfinitePayProvider extends BasePaymentProvider {
  constructor() {
    super(PaymentProvider.INFINITE_PAY)
  }

  async createPayment(data: CreatePaymentData) {
    const config = await this.getConfig()
    const credentials = config.credentials as any
    const apiKey = config.sandbox ? credentials.sandbox_api_key : credentials.apiKey
    const apiSecret = config.sandbox ? credentials.sandbox_api_secret : credentials.apiSecret

    // TODO: Implementar integração com InfinitePay
    throw new Error("Método não implementado")
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // TODO: Implementar integração com InfinitePay
    throw new Error("Método não implementado")
  }

  async validateWebhook(body: any, signature: string): Promise<boolean> {
    // TODO: Implementar validação de webhook
    throw new Error("Método não implementado")
  }
}
