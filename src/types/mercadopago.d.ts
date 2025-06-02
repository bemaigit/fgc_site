declare module 'mercadopago' {
  interface MercadoPagoConfig {
    accessToken: string;
    options?: {
      timeout?: number;
    };
  }

  interface PreferenceItem {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }

  interface PreferencePayer {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  }

  interface PreferenceBackUrls {
    success: string;
    failure: string;
    pending: string;
  }

  interface PreferencePaymentMethods {
    installments?: number;
    default_payment_method_id?: string;
  }

  interface PreferenceTransactionData {
    qr_code?: string;
    qr_code_base64?: string;
    bank_transfer_id?: string;
  }

  interface PreferencePointOfInteraction {
    transaction_data?: PreferenceTransactionData;
  }

  interface Preference {
    id: string;
    init_point: string;
    sandbox_init_point?: string;
    point_of_interaction?: PreferencePointOfInteraction;
  }

  interface PreferenceCreateRequest {
    items: PreferenceItem[];
    payer: PreferencePayer;
    payment_methods?: PreferencePaymentMethods;
    back_urls?: PreferenceBackUrls;
    auto_return?: string;
    external_reference?: string;
    notification_url?: string;
  }

  interface PaymentResponse {
    body: {
      id: string;
      status: string;
      transaction_amount: number;
      metadata?: Record<string, unknown>;
    };
  }

  interface PreferenceResponse {
    body: Preference;
  }

  interface MercadoPagoClient {
    preference: {
      create(data: PreferenceCreateRequest): Promise<PreferenceResponse>;
    };
    payment: {
      get(data: { id: string }): Promise<PaymentResponse>;
    };
  }

  export default class MercadoPago {
    constructor(config: MercadoPagoConfig);
    preference: MercadoPagoClient['preference'];
    payment: MercadoPagoClient['payment'];
  }
}
