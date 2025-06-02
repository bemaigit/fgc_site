import { 
  CreatePaymentInput, 
  PaymentResult, 
  PaymentStatus,
  PaymentMethod,
  PaymentGatewayConfig,
  CardPaymentInput,
  InstallmentOption,
  WebhookData,
  TransactionType,
  PaymentProvider
} from "@/lib/payment/types"
import { BasePaymentGateway } from "./base"

// Atualizar a interface de credenciais
export interface PagSeguroCredentials {
  token: string;
  appId?: string;
  appKey?: string;
  email?: string;
  pagseguroToken?: string;
  pagseguroAppId?: string;
  pagseguroAppKey?: string;
  pagseguroEmail?: string;
  sandbox_token?: string;
  publicKey?: string;
}

export class PagSeguroGateway extends BasePaymentGateway {
  readonly id = PaymentProvider.PAGSEGURO
  readonly name = "PagSeguro"

  private getToken(): string {
    this.validateConfig()
    
    const credentials = this.config.credentials;
    
    // Se estiver em modo sandbox e tiver um token específico para sandbox
    if (this.config.sandbox && credentials.sandbox_token) {
      console.log('PagSeguro - Usando token de sandbox')
      return credentials.sandbox_token as string;
    }
    
    // Verificar prefixos diferentes
    const token = credentials.pagseguroToken || credentials.token;
    
    if (!token) {
      throw new Error('Token do PagSeguro não encontrado nas credenciais');
    }
    
    return token as string;
  }

  private getEmail(): string | undefined {
    const credentials = this.config.credentials;
    const email = credentials.pagseguroEmail || credentials.email;
    return email ? String(email) : undefined;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      this.validateConfig()
      console.log("PagSeguro - Iniciando criação de pagamento")
      
      // Garantir que o método de pagamento seja mapeado corretamente
      const paymentMethodType = this.mapPaymentMethod(input.paymentMethod)
      console.log(`PagSeguro - Método de pagamento: ${input.paymentMethod} -> ${paymentMethodType}`)
      
      // Formatar número de telefone (remover não-numéricos)
      const phoneNumber = input.customer.phone?.replace(/\D/g, "") || "11999999999"
      
      // Valor deve ser em centavos para o PagSeguro
      const amountInCents = Math.round(input.amount * 100)
      
      const payload: any = {
        reference_id: input.metadata?.entityId || `test-${Date.now()}`,
        description: input.description,
        amount: {
          value: amountInCents,
          currency: "BRL"
        },
        payment_method: {
          type: paymentMethodType,
          installments: input.card?.installments || 1,
          capture: true
        },
        notification_urls: [
          input.callbackUrls?.notification || "https://example.com/webhook"
        ],
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          tax_id: input.customer.document?.replace(/[^\d]/g, ""), // Remove pontos, hífens e outros caracteres não numéricos
          phones: [
            {
              country: "55",
              area: phoneNumber.substring(0, 2),
              number: phoneNumber.substring(2),
              type: "MOBILE" // Campo obrigatório conforme API do PagSeguro
            }
          ]
        },
        metadata: input.metadata
      }

      // Adicionar dados específicos para cartão de crédito
      if (input.paymentMethod === "CREDIT_CARD" && input.card) {
        payload.payment_method = {
          ...payload.payment_method,
          card: {
            number: input.card.number,
            exp_month: input.card.expiryMonth,
            exp_year: input.card.expiryYear,
            security_code: input.card.cvv,
            holder: {
              name: input.card.holderName
            }
          }
        }
        
        console.log("PagSeguro - Dados de cartão adicionados ao payload")
      }
      
      console.log("PagSeguro - Payload:", JSON.stringify(payload, null, 2))
      
      const token = this.getToken()
      
      // Log parcial do token para debugging (apenas primeiros e últimos caracteres)
      const tokenLength = token.length;
      const maskedToken = tokenLength > 10 
        ? `${token.substring(0, 4)}...${token.substring(tokenLength - 4)}`
        : "Token muito curto";
      console.log("PagSeguro - Token (mascarado):", maskedToken);
      
      const url = this.config.sandbox 
        ? "https://sandbox.api.pagseguro.com/orders" 
        : "https://api.pagseguro.com/orders"
      
      console.log("PagSeguro - URL da API:", url)
      
      // Formato correto de autenticação para o PagSeguro: token direto no cabeçalho
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "x-api-version": "4.0",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      // Log da resposta para diagnóstico
      const responseText = await response.text()
      console.log(`PagSeguro - Status da resposta: ${response.status}`)
      console.log(`PagSeguro - Resposta: ${responseText}`)
      
      if (!response.ok) {
        let errorDetail = "Detalhes indisponíveis"
        try {
          const errorJson = JSON.parse(responseText)
          errorDetail = JSON.stringify(errorJson)
        } catch (e) {
          // Ignora erros de parsing
        }
        throw new Error(`Falha ao criar pagamento no PagSeguro: ${response.status} - ${errorDetail}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e: any) {
        throw new Error(`Erro ao processar resposta do PagSeguro: ${e.message}`)
      }

      // Se o PagSeguro não retornar diretamente as informações de QR code (para PIX)
      // mas retornar um link de pagamento, vamos usar esse link
      if (input.paymentMethod === "PIX" && data.links) {
        const payLink = data.links.find((link: any) => link.rel === "PAY")?.href;
        
        if (payLink) {
          console.log(`PagSeguro - Obtendo detalhes do QR code PIX em: ${payLink}`);
          
          // Chamar a API PAY para obter os detalhes do PIX
          const payResponse = await fetch(payLink, {
            method: "POST",
            headers: {
              "Authorization": token,
              "Content-Type": "application/json",
              "x-api-version": "4.0",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              payment_method: {
                type: "PIX"
              }
            })
          });
          
          if (payResponse.ok) {
            const pixData = await payResponse.json();
            console.log("PagSeguro - Dados do PIX obtidos:", JSON.stringify(pixData, null, 2));
            
            // Atualizar os dados com as informações do PIX
            if (pixData.qr_codes && pixData.qr_codes.length > 0) {
              data.qr_codes = pixData.qr_codes;
            }
          } else {
            console.log("PagSeguro - Não foi possível obter detalhes do PIX:", await payResponse.text());
          }
        }
      }

      // Verificar se temos o código PIX mas não temos a imagem do QR Code
      const pixCodeText = data.qr_codes?.[0]?.text;
      let qrCodeBase64 = undefined;
      
      if (pixCodeText) {
        console.log("PagSeguro - Código PIX disponível:", pixCodeText);
        
        // Se tiver QR code base64 do PagSeguro, usamos ele com o prefixo necessário
        if (typeof data.qr_codes?.[0]?.base64 === 'string') {
          console.log("PagSeguro - Usando QR code base64 do PagSeguro");
          qrCodeBase64 = `data:image/png;base64,${data.qr_codes[0].base64}`;
        } 
        // Caso contrário, geramos um QR code usando o QR Server API
        else {
          console.log("PagSeguro - Gerando QR code via QR Server API");
          qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCodeText)}`;
        }
      }

      return {
        id: data.id,
        status: this.mapStatus(data.status),
        amount: data.amount?.value ? data.amount.value / 100 : input.amount,
        paymentUrl: data.payment_url || data.links?.find((link: any) => link.rel === "PAY")?.href,
        qrCode: pixCodeText,
        qrCodeBase64: qrCodeBase64,
        metadata: input.metadata,
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
      }
    } catch (error) {
      console.error("PagSeguro - Erro detalhado:", error)
      return this.handleApiError(error)
    }
  }

  async createPaymentWithCard(input: CreatePaymentInput): Promise<PaymentResult> {
    return this.createPayment(input)
  }

  async processCardPayment(input: CardPaymentInput): Promise<PaymentResult> {
    throw new Error("processCardPayment not implemented for PagSeguro")
  }

  async getInstallmentOptions(amount: number, paymentMethodId?: string): Promise<InstallmentOption[]> {
    return []
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const url = this.config.sandbox
        ? `https://sandbox.api.pagseguro.com/orders/${paymentId}`
        : `https://api.pagseguro.com/orders/${paymentId}`
      
      const token = this.getToken();
      
      const response = await fetch(url, {
        headers: {
          "Authorization": token,
          "Accept": "application/json",
          "x-api-version": "4.0"
        }
      })

      if (!response.ok) {
        throw new Error("Falha ao consultar status do pagamento")
      }

      const data = await response.json()
      return this.mapStatus(data.status)
    } catch (error) {
      return this.handleApiError(error)
    }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const url = this.config.sandbox
        ? `https://sandbox.api.pagseguro.com/orders/${paymentId}/refund`
        : `https://api.pagseguro.com/orders/${paymentId}/refund`
        
      const token = this.getToken();
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-api-version": "4.0"
        }
      })

      if (!response.ok) {
        throw new Error("Falha ao processar reembolso")
      }

      const data = await response.json()
      
      return {
        id: paymentId,
        status: PaymentStatus.REFUNDED,
        amount: data.amount.value / 100,
        metadata: data.metadata,
        refundedAt: new Date()
      }
    } catch (error) {
      return this.handleApiError(error)
    }
  }

  async validateWebhook(data: any, signature?: string): Promise<boolean> {
    if (!signature) return false
    
    // Implementar validação da assinatura do webhook do PagSeguro
    // https://dev.pagseguro.uol.com.br/reference/webhook-setup
    return true
  }

  async parseWebhookData(data: any): Promise<WebhookData> {
    return {
      id: data.id,
      type: TransactionType.OTHER,
      provider: PaymentProvider.PAGSEGURO,
      status: this.mapStatus(data.status),
      amount: typeof data.amount?.value === 'number' ? data.amount.value/100 : 0,
      metadata: data.metadata,
      gatewayData: data
    }
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    const methodMap: Record<string, string> = {
      CREDIT_CARD: "CREDIT_CARD",
      DEBIT_CARD: "DEBIT_CARD",
      BOLETO: "BOLETO",
      PIX: "PIX"
    }
    return methodMap[method] || method
  }

  private mapStatus(psStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PAID: PaymentStatus.PAID,
      AUTHORIZED: PaymentStatus.PAID,
      PENDING: PaymentStatus.PENDING,
      WAITING: PaymentStatus.PENDING,
      DECLINED: PaymentStatus.FAILED,
      CANCELED: PaymentStatus.CANCELLED,
      REFUNDED: PaymentStatus.REFUNDED,
      CHARGED_BACK: PaymentStatus.REFUNDED
    }
    return statusMap[psStatus] || PaymentStatus.PENDING
  }
}
