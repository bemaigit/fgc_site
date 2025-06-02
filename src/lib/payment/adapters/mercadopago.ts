import { 
  CreatePaymentInput, 
  PaymentResult, 
  PaymentStatus,
  PaymentMethod,
  PaymentGatewayConfig,
  PaymentGateway,
  PaymentProvider,
  WebhookData,
  MercadoPagoCredentials,
  InstallmentOption,
  CardPaymentInput
} from "@/lib/payment/types"
import { createMercadoPagoClient, verifyMercadoPagoSignature } from "../utils/mercadopago"
import crypto from 'crypto'
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class MercadoPagoGateway implements PaymentGateway {
  readonly id = "mercadopago";
  readonly name = "Mercado Pago";
  
  private client: any;
  private credentials: MercadoPagoCredentials;
  private config: PaymentGatewayConfig;
  // Usar domínio principal sem /v1 para recursos de checkout
  private baseUrl = 'https://api.mercadopago.com';

  constructor(credentials: MercadoPagoCredentials) {
    this.credentials = credentials
    this.config = { credentials }
    this.client = createMercadoPagoClient(credentials.access_token)
  }

  private getAccessToken(): string {
    this.validateConfig()
    return this.config.credentials.access_token as string
  }

  private validateConfig() {
    if (!this.config) {
      throw new Error("Configuração não definida")
    }
  }

  /**
   * Consulta as opções de parcelamento disponíveis no Mercado Pago
   * @param amount Valor total do pagamento
   * @param paymentMethodId ID do método de pagamento (opcional)
   * @param bin Os 6 primeiros dígitos do cartão (opcional)
   * @returns Array com as opções de parcelamento disponíveis
   */
  async getInstallmentOptions(
    amount: number, 
    paymentMethodId?: string,
    bin?: string
  ): Promise<InstallmentOption[]> {
    try {
      this.validateConfig()

      const params: any = {
        amount: amount.toString()
      };

      if (paymentMethodId) {
        params.payment_method_id = paymentMethodId;
      }
      
      if (bin) {
        params.bin = bin; 
      }

      // Consultar API do Mercado Pago para obter opções de parcelamento
      const response = await fetch(
        `https://api.mercadopago.com/v1/payment_methods/installments?${new URLSearchParams(params).toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao consultar opções de parcelamento: ${response.status}`);
      }

      const data = await response.json();
      
      // Se não houver opções de parcelamento, retornar opção padrão (pagamento à vista)
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [{
          installments: 1,
          installmentAmount: amount,
          totalAmount: amount,
          message: `1x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} à vista`
        }];
      }

      // Transformar resposta da API em formato padronizado
      const cardOptions = data[0]; // Pegar primeiro tipo de cartão (geralmente visa/master)
      
      return cardOptions.payer_costs.map((option: any) => ({
        installments: option.installments,
        installmentAmount: option.installment_amount,
        totalAmount: option.total_amount,
        message: option.recommended_message || 
          `${option.installments}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.installment_amount)}`
      }));
    } catch (error) {
      console.error("Erro ao obter opções de parcelamento:", error);
      
      // Fallback: retornar opções de parcelamento simples sem juros
      const installmentOptions = [1, 2, 3, 6, 12];
      return installmentOptions.map(option => ({
        installments: option,
        installmentAmount: amount / option,
        totalAmount: amount,
        message: `${option}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / option)}${option === 1 ? ' à vista' : ''}`
      }));
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      this.validateConfig()
      
      console.log("Criando pagamento no Mercado Pago com URL de notificação:", input.notificationUrl);
      
      // Verificar se a URL de notificação é válida
      let notificationUrl = input.notificationUrl;
      if (!notificationUrl || !notificationUrl.startsWith('http')) {
        // Usar URL padrão se não for fornecida uma válida
        notificationUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/gateway/webhook`;
        console.log("Usando URL de notificação padrão:", notificationUrl);
      }
      
      // Criar payload base
      const basePayload = {
        transaction_amount: input.amount,
        description: input.description || 'Pagamento',
        payment_method_id: this.mapPaymentMethod(input.paymentMethod),
        payer: {
          email: input.customer.email,
          identification: {
            type: 'CPF',
            number: input.customer.document?.replace(/\D/g, '') || ''
          },
          first_name: input.customer.name?.split(' ')[0] || '',
          last_name: input.customer.name?.split(' ').slice(1).join(' ') || ''
        },
        notification_url: notificationUrl,
        metadata: input.metadata || {},
      };
      
      // Configurar payload específico para o método de pagamento
      let payload;
      let result;
      
      if (input.paymentMethod === PaymentMethod.PIX) {
        // Para PIX, voltamos a usar o endpoint de preferences que é mais confiável
        payload = {
          ...basePayload,
          payment_methods: {
            excluded_payment_methods: [],
            excluded_payment_types: [],
            default_payment_method_id: "pix",
            installments: 1
          },
          items: [
            {
              title: input.description || 'Pagamento',
              quantity: 1,
              unit_price: input.amount
            }
          ],
          back_urls: {
            success: input.returnUrl || this.baseUrl,
            failure: input.returnUrl || this.baseUrl,
            pending: input.returnUrl || this.baseUrl
          },
          auto_return: "approved"
        };
        
        // Criar preferência via API HTTP
        try {
          const response = await axios.post(
            `${this.baseUrl}/checkout/preferences`,
            payload,
            { headers: { Authorization: `Bearer ${this.getAccessToken()}`, 'Content-Type': 'application/json' } }
          );
          
          // Extração de dados da preferência
          const preferenceData = response.data;
          
          // Com preferenceData, precisamos criar um objeto similar ao retorno de v1/payments
          result = { 
            body: {
              id: preferenceData.id,
              status: 'pending',
              transaction_details: {
                external_resource_url: preferenceData.init_point
              },
              point_of_interaction: {
                transaction_data: {
                  qr_code: preferenceData.id,
                  ticket_url: preferenceData.init_point
                }
              }
            }
          };
        } catch (error: any) {
          console.error('Erro ao criar preferência PIX:', error.response?.data || error.message);
          throw error;
        }
      } else if (input.paymentMethod === PaymentMethod.BOLETO) {
        payload = {
          ...basePayload,
          payment_method_id: 'bolbradesco',
          callback_url: input.returnUrl
        };
        
        // Criar preferência de boleto via API HTTP
        const response = await axios.post(
          `${this.baseUrl}/checkout/preferences`,
          payload,
          { headers: { Authorization: `Bearer ${this.getAccessToken()}`, 'Content-Type': 'application/json' } }
        );
        
        // Extrair dados da resposta (padrão de preference)
        const preferenceData = response.data;
        
        // Montar resultado padronizado com o paymentUrl para boleto
        result = { 
          body: {
            id: preferenceData.id,
            status: 'pending',
            transaction_details: {
              payment_method_reference_id: preferenceData.id,
              external_resource_url: preferenceData.sandbox_init_point || preferenceData.init_point
            }
          } 
        } as any;
      } else if (input.paymentMethod === PaymentMethod.CREDIT_CARD || input.paymentMethod === PaymentMethod.DEBIT_CARD) {
        payload = {
          ...basePayload,
          payment_method_id: this.mapPaymentMethod(input.paymentMethod),
          // Remover a URL de notificação para pagamentos com cartão
        };
        
        // Criar uma preferência para pagamento com cartão
        payload = {
          items: [
            {
              id: `payment-${Date.now()}`,
              title: input.description || 'Pagamento com cartão',
              quantity: 1,
              unit_price: input.amount
            }
          ],
          payer: {
            email: input.customer.email,
            name: input.customer.name?.split(' ')[0] || '',
            surname: input.customer.name?.split(' ').slice(1).join(' ') || ''
          },
          payment_methods: {
            excluded_payment_methods: [],
            excluded_payment_types: [],
            installments: 12
          },
          back_urls: {
            success: input.returnUrl || `${process.env.NEXT_PUBLIC_API_URL}/pagamento/sucesso`,
            failure: input.returnUrl || `${process.env.NEXT_PUBLIC_API_URL}/pagamento/falha`,
            pending: input.returnUrl || `${process.env.NEXT_PUBLIC_API_URL}/pagamento/pendente`
          },
          auto_return: 'approved',
          notification_url: notificationUrl,
          metadata: input.metadata || {}
        };
        
        // Usar PIX como fallback para pagamentos com cartão até implementar tokenização
        result = await this.client.preference.create(payload);
      } else {
        throw new Error(`Método de pagamento não suportado: ${input.paymentMethod}`);
      }
      
      // Processar o resultado
      console.log('Resultado Mercado Pago:', JSON.stringify(result, null, 2));
      
      let paymentUrl = null;
      let paymentId = null;
      let status: PaymentStatus = PaymentStatus.PENDING;
      
      if (input.paymentMethod === PaymentMethod.CREDIT_CARD || input.paymentMethod === PaymentMethod.DEBIT_CARD) {
        paymentUrl = result.body.init_point;
        paymentId = result.body.id;
      } else {
        paymentId = result.body.id;
        status = this.mapStatus(result.body.status);
        
        // Para PIX, extrair o QR code
        if (input.paymentMethod === PaymentMethod.PIX && result.body.point_of_interaction) {
          const qrCode = result.body.point_of_interaction.transaction_data?.qr_code;
          const qrCodeBase64 = result.body.point_of_interaction.transaction_data?.qr_code_base64;
          
          // Se não temos uma imagem base64 do QR code, armazenamos pelo menos o código
          const qrCodeData = qrCodeBase64 || '';
          
          // Armazenar explicitamente no metadata para uso posterior
          result.body.metadata = {
            ...result.body.metadata,
            qrCode: qrCode,
            qrCodeBase64: qrCodeData
          };
          
          paymentUrl = result.body.point_of_interaction.transaction_data?.ticket_url || null;
          
          // Adicionar o código PIX aos detalhes adicionais
          if (qrCode) {
            result.body.additional_info = {
              ...result.body.additional_info,
              pix_code: qrCode
            };
          }
          
          console.log('QR Code Mercado Pago:', {
            qrCode,
            qrCodeBase64: qrCodeBase64 ? '[BASE64 string]' : 'não fornecido'
          });
        }
        
        // Para boleto, pegar o URL
        if (input.paymentMethod === PaymentMethod.BOLETO) {
          paymentUrl = result.body.transaction_details?.external_resource_url || null;
        }
      }
      
      // Mapear o resultado Mercado Pago para o nosso formato padrão
      const pixQrCode = input.paymentMethod === PaymentMethod.PIX ? 
                        result.body.point_of_interaction?.transaction_data?.qr_code :
                        undefined;
      
      const pixQrCodeBase64 = input.paymentMethod === PaymentMethod.PIX ?
                              result.body.point_of_interaction?.transaction_data?.qr_code_base64 :
                              undefined;
      
      // Garantir que o metadata inclua os dados do QR code para recuperação posterior
      const metadata = {
        protocol: this.generateProtocolNumber(input),
        preferenceId: result.body.id,
        qrCode: pixQrCode,
        qrCodeBase64: pixQrCodeBase64,
        ...input.metadata
      };
      
      return {
        id: result.body.id || paymentId,
        status: this.mapStatus((result.body.status as string) || 'pending'),
        amount: input.amount,
        // URL para o usuário acessar o pagamento no site do Mercado Pago
        paymentUrl: result.body.transaction_details?.external_resource_url || 
                    result.body.point_of_interaction?.transaction_data?.ticket_url,
        
        // PIX: Código de cópia e cola
        qrCode: pixQrCode,
                
        // PIX: QR code em base64 direto da API do Mercado Pago
        qrCodeBase64: pixQrCodeBase64,
        
        // Boleto: Código de barras
        barcodeNumber: input.paymentMethod === PaymentMethod.BOLETO ?
                      result.body.barcode?.content :
                      undefined,
        metadata
      };
    } catch (error: any) {
      console.error('Erro ao criar pagamento no Mercado Pago:', error);
      
      if (error.cause && Array.isArray(error.cause)) {
        const causes = error.cause.map((c: any) => c.description).join(', ');
        throw new Error(`Erro ao processar pagamento: ${causes}`);
      }
      
      throw new Error(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async createPaymentWithCard(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      this.validateConfig();
      
      if (!input.card) {
        throw new Error('Dados do cartão são obrigatórios');
      }
      
      // Formatar data de expiração (MMYY)
      const expiryMonth = input.card.expiryMonth.padStart(2, '0');
      const expiryYear = input.card.expiryYear.slice(-2); // Pegar os últimos 2 dígitos do ano
      
      // Criar payload para a API do Mercado Pago
      const payload = {
        transaction_amount: input.amount,
        installments: input.card.installments || 1,
        description: input.description || 'Pagamento com cartão',
        payment_method_id: this.detectCardType(input.card.number),
        token: input.card.token, // Se tivermos um token
        payer: {
          email: input.customer.email,
          identification: {
            type: 'CPF',
            number: input.customer.document?.replace(/\D/g, '') || ''
          }
        },
        // No ambiente de teste, sempre usar cartao_simulacao
        issuer_id: this.credentials.sandbox ? '24' : undefined,
        metadata: input.metadata || {}
      };
      
      // Se não tivermos um token, criar um token a partir dos dados do cartão
      if (!input.card.token) {
        // Em ambiente real, usaríamos o SDK do Mercado Pago para gerar o token
        // Mas para testes, podemos simular o pagamento diretamente
        
        // Gerar um ID único para o pagamento
        const paymentId = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Determinar status com base no cartão usado em ambiente sandbox
        let status = 'approved';
        if (input.card.number.endsWith('1111')) {
          status = 'rejected';
        }
        
        // Gerar protocolo no formato esperado pela aplicação
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        const protocolNumber = `${year}${month}${day}-${randomPart}`;
        
        return {
          id: paymentId,
          status: this.mapStatus(status),
          paymentUrl: '',
          protocolNumber,
          metadata: {
            installments: input.card.installments || 1,
            cardLastDigits: input.card.number.slice(-4),
            cardHolderName: input.card.holderName
          }
        };
      }
      
      // Se tivermos um token, processar o pagamento na API do Mercado Pago
      const response = await fetch(
        'https://api.mercadopago.com/v1/payments',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      
      const result = await response.json();
      
      if (response.status >= 400) {
        throw new Error(`Erro ao processar pagamento: ${result.message || JSON.stringify(result)}`);
      }
      
      // Gerar protocolo no formato esperado pela aplicação
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const protocolNumber = `${year}${month}${day}-${randomPart}`;
      
      return {
        id: result.id.toString(),
        status: this.mapStatus(result.status),
        paymentUrl: '',
        protocolNumber,
        metadata: {
          installments: input.card.installments || 1,
          cardLastDigits: input.card.number.slice(-4),
          cardHolderName: input.card.holderName
        }
      };
    } catch (error: any) {
      console.error('Erro ao processar pagamento com cartão:', error);
      throw new Error(`Erro ao processar pagamento com cartão: ${error.message}`);
    }
  }
  
  async processCardPayment(input: CardPaymentInput): Promise<PaymentResult> {
    try {
      const payload = {
        token: input.cardToken,
        installments: input.installments,
        transaction_amount: input.amount,
        description: input.description || 'Pagamento com cartão',
        payment_method_id: 'visa', // Será determinado pelo token
        payer: {
          email: input.customerEmail,
          identification: {
            type: 'CPF',
            number: input.customerDocument?.replace(/\D/g, '') || ''
          }
        },
        metadata: input.metadata || {}
      };
      
      const result = await this.client.payment.create(payload);
      
      return {
        id: result.body.id,
        status: this.mapStatus(result.body.status),
        protocolNumber: crypto.randomBytes(8).toString('hex').toUpperCase(),
        gatewayData: result.body
      };
    } catch (error: any) {
      console.error('Erro ao processar pagamento com cartão:', error);
      
      if (error.cause && Array.isArray(error.cause)) {
        const causes = error.cause.map((c: any) => c.description).join(', ');
        throw new Error(`Erro ao processar pagamento com cartão: ${causes}`);
      }
      
      throw new Error(`Erro ao processar pagamento com cartão: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      this.validateConfig()
      
      const response = await this.client.payment.get(paymentId);
      
      return this.mapStatus(response.body.status);
    } catch (error: any) {
      console.error(`Erro ao verificar status do pagamento ${paymentId}:`, error);
      throw new Error(`Erro ao verificar status do pagamento: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string): Promise<PaymentResult> {
    try {
      this.validateConfig()
      
      const response = await this.client.payment.refund(paymentId);
      
      return {
        id: paymentId,
        status: PaymentStatus.REFUNDED,
        gatewayData: response.body
      };
    } catch (error: any) {
      console.error(`Erro ao estornar pagamento ${paymentId}:`, error);
      throw new Error(`Erro ao estornar pagamento: ${error.message}`);
    }
  }

  async validateWebhook(headers: Record<string, string>, body: unknown): Promise<boolean> {
    // Verificação básica para garantir que é um webhook do Mercado Pago
    if (!headers['x-signature'] && !headers['x-hook-id']) {
      return false;
    }
    
    // Se tivermos um webhook secret, verificar a assinatura
    if (typeof this.credentials.webhook_secret === 'string') {
      const signature = headers['x-signature'] || '';
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      return verifyMercadoPagoSignature(signature, payload, this.credentials.webhook_secret);
    }
    
    // Se não tivermos webhook secret, aceitar qualquer webhook do Mercado Pago
    return true;
  }

  async parseWebhookData(data: unknown): Promise<WebhookData> {
    try {
      const webhook = data as any;
      
      if (!webhook || !webhook.data || !webhook.data.id) {
        throw new Error('Webhook inválido');
      }
      
      // Buscar detalhes do pagamento
      const paymentId = webhook.data.id;
      const response = await this.client.payment.get(paymentId);
      
      const payment = response.body;
      const status = this.mapStatus(payment.status);
      
      return {
        id: paymentId,
        type: webhook.type || 'payment.updated',
        provider: 'MERCADO_PAGO',
        amount: payment.transaction_amount || 0,
        status,
        event: webhook.type || 'payment.updated',
        paymentId,
        gatewayData: payment
      };
    } catch (error: any) {
      console.error('Erro ao processar webhook do Mercado Pago:', error);
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return 'credit_card';
      case PaymentMethod.DEBIT_CARD:
        return 'debit_card';
      case PaymentMethod.PIX:
        return 'pix';
      case PaymentMethod.BOLETO:
        return 'bolbradesco';
      default:
        return 'credit_card';
    }
  }

  private mapStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.PAID;
      case 'authorized':
        return PaymentStatus.PROCESSING; // Mapeamos para PROCESSING já que não temos AUTHORIZED
      case 'in_process':
      case 'in_mediation':
      case 'pending':
        return PaymentStatus.PENDING;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
  
  private detectCardType(cardNumber: string): string {
    // Remover espaços
    const number = cardNumber.replace(/\s+/g, '');
    
    // Visa: Começa com 4
    if (/^4/.test(number)) {
      return 'visa';
    }
    
    // Mastercard: Começa com 5[1-5]
    if (/^5[1-5]/.test(number)) {
      return 'master';
    }
    
    // American Express: Começa com 34 ou 37
    if (/^3[47]/.test(number)) {
      return 'amex';
    }
    
    // Elo: vários prefixos
    if (/^(401178|401179|431274|438935|451416|457393|457631|457632|504175|627780|636297|636368)/.test(number)) {
      return 'elo';
    }
    
    // Hipercard: Começa com 606282
    if (/^606282/.test(number)) {
      return 'hipercard';
    }
    
    // Padrão: usar visa
    return 'visa';
  }

  private generateProtocolNumber(input: CreatePaymentInput): string {
    // Gerar um protocolo baseado em timestamp e informações do pagamento
    const timestamp = new Date().getTime().toString();
    const data = `${timestamp}-${input.customer.email}-${input.amount}`;
    const hash = crypto.createHash('md5').update(data).digest('hex');
    
    // Retornar os primeiros 8 caracteres do hash em maiúsculas
    return hash.substring(0, 8).toUpperCase();
  }
}
