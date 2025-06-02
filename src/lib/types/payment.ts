export interface CardData {
  token: string;
  installments?: number;
  [key: string]: unknown;
}

export enum TransactionType {
  MEMBERSHIP = 'MEMBERSHIP',
  EVENT = 'EVENT',
  OTHER = 'OTHER'
}

export interface ProtocolData {
  type: TransactionType;
  entityId: string;
  paymentId: string;
  status: string;
}
