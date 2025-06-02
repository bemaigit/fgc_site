import { PaymentProvider } from "../types"
import { BasePaymentProvider } from "./base"
import { MercadoPagoProvider } from "./mercadopago"
import { PagSeguroProvider } from "./pagseguro"
import { AsaasProvider } from "./asaas"
import { PagHiperProvider } from "./paghiper"
import { AppmaxProvider } from "./appmax"
import { PagarMeProvider } from "./pagarme"
import { YampiProvider } from "./yampi"
import { InfinitePayProvider } from "./infinitepay"
import { GetnetProvider } from "./getnet"

export class PaymentProviderFactory {
  private static providers: Map<PaymentProvider, BasePaymentProvider> = new Map()

  static getProvider(provider: PaymentProvider): BasePaymentProvider {
    if (!this.providers.has(provider)) {
      switch (provider) {
        case PaymentProvider.MERCADO_PAGO:
          this.providers.set(provider, new MercadoPagoProvider())
          break
        case PaymentProvider.PAGSEGURO:
          this.providers.set(provider, new PagSeguroProvider())
          break
        case PaymentProvider.ASAAS:
          this.providers.set(provider, new AsaasProvider())
          break
        case PaymentProvider.PAGHIPER:
          this.providers.set(provider, new PagHiperProvider())
          break
        case PaymentProvider.APPMAX:
          this.providers.set(provider, new AppmaxProvider())
          break
        case PaymentProvider.PAGARME:
          this.providers.set(provider, new PagarMeProvider())
          break
        case PaymentProvider.YAMPI:
          this.providers.set(provider, new YampiProvider())
          break
        case PaymentProvider.INFINITE_PAY:
          this.providers.set(provider, new InfinitePayProvider())
          break
        case PaymentProvider.GETNET:
          this.providers.set(provider, new GetnetProvider())
          break
        default:
          throw new Error(`Provider ${provider} não suportado`)
      }
    }

    return this.providers.get(provider)!
  }
}
