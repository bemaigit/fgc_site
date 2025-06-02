import { PaymentProvider, PaymentMethod, EntityType, GatewayConfig } from "@/lib/payment/types"

export type FormData = {
  name: string
  provider: PaymentProvider
  active: boolean
  priority: number
  allowedMethods: PaymentMethod[]
  entityTypes: EntityType[]
  checkoutType: 'REDIRECT' | 'TRANSPARENT'
  sandbox: boolean
  webhook?: {
    secretKey?: string
    retryAttempts: number
    retryInterval: number
  }
  urls?: {
    success?: string
    failure?: string
    notification?: string
  }
  credentials: {
    access_token?: string
    accessToken?: string
    public_key?: string
    publicKey?: string
    sandbox_access_token?: string
    sandbox_public_key?: string
    email?: string
    token?: string
    appId?: string
    appKey?: string
    apiKey?: string
  }
}

export type GatewayFormData = FormData

export interface GatewayFormProps {
  onSubmit: (data: FormData) => Promise<void>
  onCancel?: () => void
  initialData?: GatewayConfig
}