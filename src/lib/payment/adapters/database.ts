import { GatewayConfig, PaymentProvider } from "../types"
import { Prisma } from "@prisma/client"

// Interface que representa a estrutura exata do modelo no banco
interface DatabaseGatewayConfig {
  id: string
  name: string
  provider: string
  active: boolean
  priority: number
  credentials: Prisma.JsonValue
  allowedMethods: string[]
  entityTypes: string[]
  createdAt: Date
  updatedAt: Date
}

export function validateGatewayConfig(raw: unknown): raw is DatabaseGatewayConfig {
  try {
    if (!raw || typeof raw !== 'object') return false
    
    const config = raw as Record<string, unknown>
    
    return (
      typeof config.id === 'string' &&
      typeof config.name === 'string' &&
      typeof config.provider === 'string' &&
      typeof config.active === 'boolean' &&
      typeof config.priority === 'number' &&
      Array.isArray(config.allowedMethods) &&
      Array.isArray(config.entityTypes) &&
      config.credentials !== null
    )
  } catch (error) {
    console.error("Erro ao validar configuração:", error)
    return false
  }
}

export function adaptGatewayConfig(config: DatabaseGatewayConfig): GatewayConfig {
  try {
    if (!Object.values(PaymentProvider).includes(config.provider as PaymentProvider)) {
      throw new Error(`Provider inválido: ${config.provider}`)
    }

    return {
      id: config.id,
      name: config.name,
      provider: config.provider as PaymentProvider,
      active: config.active,
      priority: config.priority,
      allowedMethods: config.allowedMethods,
      entityTypes: config.entityTypes,
      credentials: config.credentials as Record<string, unknown>
    }
  } catch (error) {
    console.error('Erro ao adaptar configuração do gateway:', error)
    throw new Error(`Falha ao processar configuração do gateway ${config.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}