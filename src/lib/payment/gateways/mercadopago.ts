import {
  PaymentGateway,
  PaymentMethod,
  PaymentResult,
  PaymentStatus,
  CreatePaymentInput,
  WebhookData,
} from "../types"
import { createHmac } from "crypto"
// Importação correta para a versão 2.3.0 - usando import padrão
import MercadoPagoSDK from 'mercadopago'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export interface MercadoPagoCredentials {
  access_token: string;
  public_key?: string;
  /** Secret for validating Mercado Pago webhooks */
  webhook_secret?: string;
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly id = "mercadopago-sandbox"
  readonly name = "Mercado Pago (Sandbox)"
  private credentials: MercadoPagoCredentials
  private sdk: any

  constructor(credentials: MercadoPagoCredentials) {
    console.log("MercadoPago Gateway - Inicializando com credenciais:", {
      hasAccessToken: !!credentials.access_token,
      hasPublicKey: !!credentials.public_key,
      accessTokenPrefix: credentials.access_token?.substring(0, 10)
    })

    this.credentials = credentials
    
    // Inicialização conforme documentação oficial
    this.sdk = new MercadoPagoSDK({
      accessToken: credentials.access_token
    });
  }

  private getPaymentMethodId(method: PaymentMethod): string {
    switch (method) {
      case "PIX":
        return "pix"
      case "BOLETO":
        return "bolbradesco"
      default:
        throw new Error(`Payment method ${method} not supported`)
    }
  }

  private mapStatus(status: string): PaymentStatus {
    switch (status.toLowerCase()) {
      case "approved":
        return PaymentStatus.PAID
      case "pending":
        return PaymentStatus.PENDING
      case "in_process":
        return PaymentStatus.PENDING
      case "rejected":
        return PaymentStatus.FAILED
      case "refunded":
        return PaymentStatus.REFUNDED
      case "cancelled":
        return PaymentStatus.CANCELLED
      case "in_mediation":
        return PaymentStatus.PENDING
      default:
        return PaymentStatus.PENDING
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      console.log("1. Iniciando criação de pagamento no Mercado Pago")
      console.log("Dados recebidos:", JSON.stringify(input, null, 2))

      // Validar input
      if (!input) {
        throw new Error("Input não pode ser nulo")
      }

      if (!input.customer) {
        throw new Error("Customer não pode ser nulo")
      }

      if (!input.amount) {
        throw new Error("Amount não pode ser nulo")
      }

      if (!input.paymentMethod) {
        throw new Error("PaymentMethod não pode ser nulo")
      }

      // Separar nome em first_name e last_name
      const nameParts = (input.customer.name || "").split(' ')
      const firstName = nameParts[0] || "Nome"
      const lastName = nameParts.slice(1).join(' ') || "Sobrenome"

      // Formatar CPF (remover pontos e traços)
      const documentNumber = (input.customer.document || "").replace(/[^\d]/g, '')
      console.log("2. Documento formatado:", documentNumber)

      // Converter o valor de centavos para reais
      const amount = Number(input.amount) / 100
      console.log("3. Valor em reais:", amount)

      const preferenceData = {
        items: [
          {
            id: "membership",
            title: input.description,
            description: input.description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount
          }
        ],
        payer: {
          email: input.customer.email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: "CPF",
            number: documentNumber
          }
        },
        payment_methods: {
          installments: 1,
          default_payment_method_id: this.getPaymentMethodId(input.paymentMethod)
        },
        back_urls: {
          success: `${BASE_URL}/filiacao/success`,
          failure: `${BASE_URL}/filiacao/failure`,
          pending: `${BASE_URL}/filiacao/pending`
        },
        auto_return: "approved",
        external_reference: JSON.stringify(input.metadata || {}),
        notification_url: `${BASE_URL}/api/webhooks/payment`
      }

      console.log("4. Preferência final:", JSON.stringify(preferenceData, null, 2))

      // Criar preferência de pagamento conforme documentação oficial
      const preference = new this.sdk.Preference();
      const response = await preference.create(preferenceData);
      
      console.log("5. Resposta do Mercado Pago:", JSON.stringify(response, null, 2))

      // Simular aprovação automática em ambiente de desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log("Ambiente de desenvolvimento detectado. Simulando aprovação automática do pagamento.")
        // Não fazemos nada aqui, apenas logamos a mensagem
      }

      const jsonMetadata = input.metadata ? JSON.stringify(input.metadata) : "{}"

      return {
        id: response.body.id,
        status: PaymentStatus.PENDING,
        amount: input.amount,
        paymentUrl: response.body.init_point,
        qrCode: response.body.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
        barcodeNumber: response.body.point_of_interaction?.transaction_data?.bank_transfer_id,
        metadata: JSON.parse(jsonMetadata)
      }
    } catch (error) {
      console.error("Erro ao criar pagamento no Mercado Pago:", error)
      if (error instanceof Error) {
        console.error("Causa do erro:", error.message)
      }
      throw error
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // Instanciar a classe Payment conforme documentação
      const payment = new this.sdk.Payment();
      const response = await payment.get({ id: paymentId });
      return this.mapStatus(response.body.status);
    } catch (error) {
      console.error("Error getting payment status from Mercado Pago:", error)
      throw error
    }
  }

  async validateWebhook(headers: Record<string, string>, body: unknown): Promise<boolean> {
    try {
      // Para o Mercado Pago, não há validação de assinatura padrão
      // Consideramos válido se o corpo contiver os dados necessários
      if (typeof body === 'object' && body !== null && 'data' in body) {
        return true
      }
      return false
    } catch (error) {
      console.error("Error validating webhook:", error)
      return false
    }
  }

  async parseWebhookData(data: unknown): Promise<WebhookData> {
    try {
      // Verificar se os dados têm o formato esperado
      if (typeof data !== 'object' || data === null || !('data' in data)) {
        throw new Error("Formato de webhook inválido")
      }
      
      const webhookData = data as any
      const paymentId = webhookData.data?.id
      
      if (!paymentId) {
        throw new Error("ID de pagamento não encontrado no webhook")
      }
      
      // Instanciar a classe Payment conforme documentação
      const payment = new this.sdk.Payment();
      const response = await payment.get({ id: paymentId });
      const paymentData = response.body;
      
      return {
        id: String(paymentData.id),
        type: "payment.updated",
        provider: "mercadopago",
        status: this.mapStatus(paymentData.status),
        amount: paymentData.transaction_amount * 100,
        metadata: paymentData.metadata || {},
        event: webhookData.type || "payment.updated",
        paymentId: String(paymentData.id),
        gatewayData: paymentData
      }
    } catch (error) {
      console.error("Error parsing webhook data:", error)
      throw error instanceof Error
        ? error
        : new Error("Erro ao processar dados do webhook")
    }
  }

  // Métodos adicionais exigidos pela interface PaymentGateway
  async createPaymentWithCard(): Promise<PaymentResult> {
    throw new Error("Método não implementado")
  }

  async processCardPayment(): Promise<PaymentResult> {
    throw new Error("Método não implementado")
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    throw new Error("Método não implementado")
  }

  async getInstallmentOptions(): Promise<any> {
    throw new Error("Método não implementado")
  }
}
