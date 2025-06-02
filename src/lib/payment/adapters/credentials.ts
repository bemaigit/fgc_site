import {
  MercadoPagoCredentials,
  PagSeguroCredentials,
  AsaasCredentials,
  PagHiperCredentials,
  PaymentProvider
} from '../types'

export function adaptCredentials(provider: PaymentProvider, credentials: Record<string, unknown>) {
  switch (provider) {
    case PaymentProvider.MERCADO_PAGO:
      return {
        access_token: credentials.access_token as string,
        public_key: credentials.public_key as string
      } as MercadoPagoCredentials

    case PaymentProvider.PAGSEGURO:
      return {
        email: credentials.email as string,
        token: credentials.token as string,
        appId: credentials.appId as string,
        appKey: credentials.appKey as string
      } as PagSeguroCredentials

    case PaymentProvider.ASAAS:
      return {
        accessToken: credentials.accessToken as string
      } as AsaasCredentials

    case PaymentProvider.PAGHIPER:
      return {
        apiKey: credentials.apiKey as string,
        token: credentials.token as string
      } as PagHiperCredentials

    default:
      throw new Error(`Provider ${provider} não suportado`)
  }
}