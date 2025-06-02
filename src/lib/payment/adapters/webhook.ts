import { PaymentStatus, WebhookData, PaymentMetadata } from "../types"
import crypto from "crypto"

export interface MercadoPagoWebhook {
  paymentId: string
  status: string
  metadata: {
    gatewayId: string
    paymentType: string
    customerId: string
    type: string
    entityId: string
    entityType: string
    referenceCode?: string
    orderId?: string
  }
}

export interface AsaasWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
  }
}

export interface PagseguroWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    paymentType: string
  }
}

export interface PagHiperWebhook {
  paymentId: string
  status: string
  valueCents: number
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    orderId: string
  }
}

export interface AppmaxWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
    orderId?: string
  }
}

export interface PagarMeWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
    orderId?: string
  }
}

export interface YampiWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
    orderId?: string
  }
}

export interface InfinitePayWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
    orderId?: string
  }
}

export interface GetnetWebhook {
  paymentId: string
  status: string
  metadata: {
    type: string
    entityId: string
    entityType: string
    gatewayId: string
    customerId: string
    paymentType: string
    orderId?: string
  }
}

export function adaptMercadoPagoWebhook(payload: MercadoPagoWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: payload.status as PaymentStatus,
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptAsaasWebhook(payload: AsaasWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: payload.status as PaymentStatus,
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptPagseguroWebhook(payload: PagseguroWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: payload.status as PaymentStatus,
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptPagHiperWebhook(payload: PagHiperWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: payload.status as PaymentStatus,
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptAppmaxWebhook(payload: AppmaxWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: mapAppmaxStatus(payload.status),
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptPagarMeWebhook(payload: PagarMeWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: mapPagarMeStatus(payload.status),
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptYampiWebhook(payload: YampiWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: mapYampiStatus(payload.status),
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptInfinitePayWebhook(payload: InfinitePayWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: mapInfinitePayStatus(payload.status),
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

export function adaptGetnetWebhook(payload: GetnetWebhook): WebhookData {
  return {
    id: crypto.randomUUID(),
    type: "payment.update",
    paymentId: payload.paymentId,
    status: mapGetnetStatus(payload.status),
    metadata: payload.metadata as PaymentMetadata,
    data: JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
  }
}

function mapAppmaxStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'approved': PaymentStatus.APPROVED,
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'rejected': PaymentStatus.REJECTED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED
  }
  return statusMap[status] || PaymentStatus.ERROR
}

function mapPagarMeStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'paid': PaymentStatus.APPROVED,
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'refused': PaymentStatus.REJECTED,
    'canceled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED
  }
  return statusMap[status] || PaymentStatus.ERROR
}

function mapYampiStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'approved': PaymentStatus.APPROVED,
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'rejected': PaymentStatus.REJECTED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED
  }
  return statusMap[status] || PaymentStatus.ERROR
}

function mapInfinitePayStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'approved': PaymentStatus.APPROVED,
    'pending': PaymentStatus.PENDING,
    'processing': PaymentStatus.PROCESSING,
    'rejected': PaymentStatus.REJECTED,
    'cancelled': PaymentStatus.CANCELLED,
    'refunded': PaymentStatus.REFUNDED
  }
  return statusMap[status] || PaymentStatus.ERROR
}

function mapGetnetStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'APPROVED': PaymentStatus.APPROVED,
    'PENDING': PaymentStatus.PENDING,
    'PROCESSING': PaymentStatus.PROCESSING,
    'REJECTED': PaymentStatus.REJECTED,
    'CANCELLED': PaymentStatus.CANCELLED,
    'REFUNDED': PaymentStatus.REFUNDED
  }
  return statusMap[status] || PaymentStatus.ERROR
}