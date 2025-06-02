import axios from 'axios';
import { 
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  TransactionStatus,
  MercadoPagoCredentials,
  PaymentMethod
} from './types'

interface MercadoPagoPreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
  date_created: string
  items: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
  }>
  payment_methods: {
    excluded_payment_methods: Array<{ id: string }>
    excluded_payment_types: Array<{ id: string }>
  }
}

interface MercadoPagoPaymentResponse {
  id: number
  status: string
  status_detail: string
  transaction_amount: number
  transaction_details?: {
    external_resource_url?: string
    payment_method_reference_id?: string
  }
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string
      qr_code_base64?: string
      ticket_url?: string
    }
  }
}

export class MercadoPagoGateway implements PaymentGateway {
  private baseUrl = 'https://api.mercadopago.com/v1';
  private accessToken: string;

  constructor(credentials: MercadoPagoCredentials) {
    console.log("Inicializando cliente Mercado Pago")
    
    if (!credentials.access_token) {
      throw new Error("Access token não fornecido")
    }

    this.accessToken = credentials.access_token;
  }

  private async createPreference(data: CreatePaymentInput, paymentType: string): Promise<MercadoPagoPreferenceResponse> {
    const preferenceData = {
      items: [{
        title: data.description,
        unit_price: data.amount,
        quantity: 1,
      }],
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: []
      },
      payer: {
        email: data.customer.email,
        identification: {
          type: "CPF",
          number: data.customer.document
        }
      },
      // Adiciona metadados para rastreamento
      metadata: {
        ...data.metadata,
        integration_method: "API",
        platform: "FGC"
      },
      // URLs de retorno
      back_urls: {
        success: data.successUrl,
        failure: data.failureUrl
      },
      // Notificação de mudança de status
      notification_url: data.notificationUrl,
      // Tipo de pagamento específico
      payment_method_id: paymentType
    };

    try {
      const response = await axios.post<MercadoPagoPreferenceResponse>(
        `${this.baseUrl}/preferences`,
        preferenceData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      throw new Error('Falha ao criar preferência de pagamento');
    }
  }

  async createPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    console.log("Criando pagamento no Mercado Pago:", data)

    try {
      if (!data.amount || data.amount <= 0) {
        throw new Error("Valor do pagamento inválido")
      }

      if (!data.description) {
        throw new Error("Descrição do pagamento não fornecida")
      }

      if (!data.paymentMethod) {
        throw new Error("Método de pagamento não fornecido")
      }

      switch (data.paymentMethod) {
        case PaymentMethod.PIX:
          return await this.createPixPayment(data)
        case PaymentMethod.CREDIT_CARD:
          return await this.createCreditCardPayment(data)
        case PaymentMethod.BOLETO:
          return await this.createBoletoPayment(data)
        default:
          throw new Error(`Método de pagamento não suportado: ${data.paymentMethod}`)
      }
    } catch (error) {
      console.error("Erro ao criar pagamento no Mercado Pago:", error)
      throw error
    }
  }

  private async createCreditCardPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    const preference = await this.createPreference(data, 'credit_card');

    return {
      id: preference.id,
      status: TransactionStatus.PENDING,
      amount: data.amount,
      paymentUrl: preference.init_point,
      metadata: data.metadata
    };
  }

  private async createBoletoPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    const preference = await this.createPreference(data, 'bolbradesco');

    return {
      id: preference.id,
      status: TransactionStatus.PENDING,
      amount: data.amount,
      paymentUrl: preference.init_point,
      metadata: data.metadata
    };
  }

  private async createPixPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    const preference = await this.createPreference(data, 'pix');

    return {
      id: preference.id,
      status: TransactionStatus.PENDING,
      amount: data.amount,
      paymentUrl: preference.init_point,
      metadata: data.metadata
    };
  }

  async getPaymentStatus(transactionId: string): Promise<TransactionStatus> {
    console.log("Consultando status do pagamento:", transactionId)

    try {
      const response = await axios.get<MercadoPagoPaymentResponse>(
        `${this.baseUrl}/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return this.mapStatus(response.data.status);
    } catch (error) {
      console.error("Erro ao consultar status do pagamento:", error)
      throw error
    }
  }

  private mapStatus(status: string): TransactionStatus {
    const statusMap: Record<string, TransactionStatus> = {
      pending: TransactionStatus.PENDING,
      approved: TransactionStatus.PAID,
      authorized: TransactionStatus.PROCESSING,
      in_process: TransactionStatus.PROCESSING,
      in_mediation: TransactionStatus.PROCESSING,
      rejected: TransactionStatus.FAILED,
      cancelled: TransactionStatus.CANCELLED,
      refunded: TransactionStatus.REFUNDED,
      charged_back: TransactionStatus.REFUNDED,
    }

    return statusMap[status] || TransactionStatus.PENDING
  }
}
