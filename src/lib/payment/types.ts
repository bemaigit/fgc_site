import { PaymentStatus as PrismaPaymentStatus, PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

export { PrismaPaymentMethod as PaymentMethod };

// Tipo estendido para incluir o status CONFIRMED
export type PaymentStatus = PrismaPaymentStatus | 'CONFIRMED';

// Reexportando os valores do enum original para uso em switch/case
export const PaymentStatus = {
  ...PrismaPaymentStatus,
  CONFIRMED: 'CONFIRMED' as PaymentStatus
};

export type CardData = {
  number: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments?: number;
};

export enum TransactionType {
  MEMBERSHIP = 'MEMBERSHIP',
  EVENT = 'EVENT',
  OTHER = 'OTHER'
}

export enum EntityType {
  ATHLETE = 'ATHLETE',
  CLUB = 'CLUB',
  EVENT = 'EVENT',
  FEDERATION = 'FEDERATION'
}

export enum PaymentProvider {
  MERCADO_PAGO = 'MERCADO_PAGO',
  PAGSEGURO = 'PAGSEGURO'
}

export type PaymentMetadata = {
  type?: string;
  entityId?: string;
  entityType?: string;
  referenceCode?: string;
  [key: string]: unknown;
}

export interface BaseCredentials {
  [key: string]: unknown;
}

export interface MercadoPagoCredentials extends BaseCredentials {
  access_token: string;
  /** Secret for validating Mercado Pago webhooks */
  webhook_secret?: string;
  public_key?: string;
}

export interface PagSeguroCredentials extends BaseCredentials {
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

export interface InstallmentOption {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  message: string;
}

export interface PaymentGatewayConfig {
  credentials: BaseCredentials;
  sandbox?: boolean;
}

export interface CreatePaymentInput {
  amount: number;
  description: string;
  paymentMethod: PrismaPaymentMethod;
  customer: {
    name: string;
    email: string;
    document: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  metadata?: PaymentMetadata;
  cardData?: CardData;
  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    installments?: number;
    token?: string;
  };
  notificationUrl?: string;
  callbackUrls?: {
    success?: string;
    failure?: string;
    notification?: string;
  };
  token?: string;
  returnUrl?: string;
  cancelUrl?: string;
  pendingUrl?: string;
}

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  amount?: number;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  paymentQrCodeUrl?: string;
  barcodeNumber?: string;
  metadata?: PaymentMetadata;
  protocolNumber?: string;
  gatewayData?: any;
  paidAt?: Date;
  expiresAt?: Date;
  refundedAt?: Date;
}

export interface WebhookData {
  id: string;
  type: string;
  provider: string;
  status: PaymentStatus;
  amount: number;
  metadata?: PaymentMetadata;
  event?: string;
  paymentId?: string;
  gatewayData?: any;
}

export interface ProtocolData {
  type: TransactionType;
  entityId: string;
  paymentId: string;
  status: PaymentStatus;
}

export interface CardPaymentInput {
  id: string;
  cardToken: string;
  installments: number;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  amount: number;
  description?: string;
  customerEmail?: string;
  customerDocument?: string;
  metadata?: PaymentMetadata;
}

export interface PaymentGateway {
  id: string;
  name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  createPaymentWithCard(input: CreatePaymentInput): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  processCardPayment(input: CardPaymentInput): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<PaymentResult>;
  validateWebhook(headers: Record<string, string>, body: unknown): Promise<boolean>;
  parseWebhookData(data: unknown): Promise<WebhookData>;
  getInstallmentOptions(amount: number, paymentMethodId?: string): Promise<InstallmentOption[]>;
}
