import { Prisma, PaymentStatus, PaymentMethod, PaymentEntityType } from '@prisma/client';
import { PaymentMetadata } from '../payment/types';

export interface PaymentTransactionCreateInput {
  id: string;
  gatewayConfigId: string;
  entityId: string;
  entityType: PaymentEntityType;
  amount: Prisma.Decimal;
  description?: string | null;
  paymentMethod: PaymentMethod;
  paymentUrl?: string | null;
  externalId?: string | null;
  metadata?: PaymentMetadata;
  status: PaymentStatus;
  athleteId?: string | null;
  protocol: string;
  updatedAt: Date;
  createdAt?: Date;
}

export interface PaymentTransactionData extends Omit<PaymentTransactionCreateInput, 'createdAt'> {
  createdAt: Date;
}
