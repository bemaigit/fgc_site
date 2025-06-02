import { PrismaClient } from '@prisma/client'
import {
  PaymentProvider,
  PaymentStatus,
  CreatePaymentInput,
  PaymentResult,
  PaymentGateway,
  MercadoPagoCredentials,
  PagSeguroCredentials,
  WebhookData
} from "./types"
import { MercadoPagoGateway } from "./gateways/mercadopago"
import { PagSeguroGateway } from "./adapters/pagseguro"

const prisma = new PrismaClient()

export class PaymentGatewayService {
  private static instance: PaymentGatewayService
  private gateways: Map<string, PaymentGateway>

  private constructor() {
    this.gateways = new Map()
  }

  public static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService()
    }
    return PaymentGatewayService.instance
  }

  async getActiveGateway(provider?: PaymentProvider): Promise<PaymentGateway> {
    try {
      // Buscar configuração ativa no banco
      console.log("1. Buscando gateway ativo...")
      const config = await prisma.paymentGatewayConfig.findFirst({
        where: {
          active: true,
          ...(provider ? { provider } : {})
        },
        select: {
          id: true,
          name: true,
          provider: true,
          active: true,
          credentials: true,
          sandbox: true
        }
      })

      if (!config) {
        console.error("Nenhum gateway de pagamento ativo encontrado")
        throw new Error("No active payment gateway found")
      }

      if (!config.credentials) {
        console.error("Gateway encontrado mas sem credenciais configuradas")
        throw new Error("Payment gateway credentials not configured")
      }

      console.log("2. Configuração encontrada:", {
        id: config.id,
        provider: config.provider,
        active: config.active,
        hasCredentials: !!config.credentials,
        credentialsType: typeof config.credentials
      })

      // Se já temos uma instância do gateway, retornar ela
      if (this.gateways.has(config.id)) {
        console.log("3. Usando gateway existente")
        return this.gateways.get(config.id)!
      }

      console.log("3. Criando nova instância do gateway")
      // Criar nova instância do gateway
      let gateway: PaymentGateway
      switch (config.provider as PaymentProvider) {
        case PaymentProvider.MERCADO_PAGO: {
          const mpCredentials = config.credentials as MercadoPagoCredentials
          
          if (!mpCredentials.access_token) {
            console.error("Access token não configurado")
            throw new Error("Mercado Pago access token not configured")
          }

          console.log("4. Credenciais Mercado Pago:", {
            hasAccessToken: !!mpCredentials.access_token,
            hasPublicKey: !!mpCredentials.public_key,
            accessTokenPrefix: mpCredentials.access_token.substring(0, 10)
          })
          
          gateway = new MercadoPagoGateway(mpCredentials)
          break
        }
        case PaymentProvider.PAGSEGURO: {
          const psCredentials = config.credentials as PagSeguroCredentials
          gateway = new PagSeguroGateway({ credentials: psCredentials, sandbox: config.sandbox || false })
          break
        }
        default:
          throw new Error(`Payment provider ${config.provider} not supported`)
      }

      console.log("5. Gateway criado com sucesso")
      // Armazenar instância para uso futuro
      this.gateways.set(config.id, gateway)

      return gateway
    } catch (error) {
      console.error("Error getting active gateway:", error)
      throw error // Propagar o erro para ser tratado na camada superior
    }
  }

  async initializeGateway(config: { provider: PaymentProvider, accessToken: string }): Promise<PaymentGateway | null> {
    try {
      // Criar nova instância do gateway
      let gateway: PaymentGateway
      switch (config.provider) {
        case PaymentProvider.MERCADO_PAGO:
          gateway = new MercadoPagoGateway(config.accessToken)
          break
        default:
          throw new Error(`Payment provider ${config.provider} not supported`)
      }

      return gateway
    } catch (error) {
      console.error("Error initializing gateway:", error)
      return null
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      console.log("1. Iniciando criação de pagamento")
      const gateway = await this.getActiveGateway()
      
      if (!gateway) {
        console.error("2. Gateway não encontrado")
        throw new Error("No active payment gateway found")
      }
      
      console.log("3. Gateway encontrado, processando pagamento...")
      const result = await gateway.createPayment(input)
      console.log("4. Pagamento processado:", {
        id: result.id,
        status: result.status,
        hasPaymentUrl: !!result.paymentUrl
      })
      
      return result
    } catch (error) {
      console.error("5. Erro ao criar pagamento:", error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error)
      throw error
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const gateway = await this.getActiveGateway()
    if (!gateway) {
      throw new Error("No active payment gateway found")
    }
    return gateway.getPaymentStatus(paymentId)
  }

  async validateWebhook(data: any, signature?: string): Promise<boolean> {
    const gateway = await this.getActiveGateway()
    if (!gateway) {
      throw new Error("No active payment gateway found")
    }
    return gateway.validateWebhook(data, signature)
  }

  async parseWebhookData(data: any): Promise<WebhookData> {
    const gateway = await this.getActiveGateway()
    if (!gateway) {
      throw new Error("No active payment gateway found")
    }
    return gateway.parseWebhookData(data)
  }
}

export const paymentGatewayService = PaymentGatewayService.getInstance()
