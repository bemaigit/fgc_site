import { PrismaClient } from '@prisma/client'
import { PaymentProvider } from '@/lib/payment/types'
import { MercadoPagoCredentials } from '@/lib/payment/types'

const prisma = new PrismaClient()

interface RawCredentials {
  access_token?: string
  accessToken?: string
  public_key?: string
  publicKey?: string
  [key: string]: string | undefined
}

async function fixMercadoPagoCredentials() {
  try {
    // Buscar a configuração do Mercado Pago
    const gateway = await prisma.paymentGatewayConfig.findFirst({
      where: {
        provider: PaymentProvider.MERCADO_PAGO
      }
    })

    if (!gateway) {
      console.log('Nenhuma configuração do Mercado Pago encontrada')
      return
    }

    // Converter as credenciais para o formato correto
    let credentials: RawCredentials = {}

    // Se as credenciais estiverem como string, tentar converter para objeto
    if (typeof gateway.credentials === 'string') {
      try {
        credentials = JSON.parse(gateway.credentials)
      } catch (e) {
        console.error('Erro ao fazer parse das credenciais:', e)
        return
      }
    } else if (gateway.credentials) {
      credentials = gateway.credentials as RawCredentials
    }

    // Garantir que as credenciais estejam no formato correto
    const formattedCredentials: MercadoPagoCredentials = {
      access_token: credentials.access_token || credentials.accessToken || '',
      public_key: credentials.public_key || credentials.publicKey || ''
    }

    // Atualizar no banco com o formato correto
    await prisma.paymentGatewayConfig.update({
      where: {
        id: gateway.id
      },
      data: {
        credentials: formattedCredentials
      }
    })

    console.log('Credenciais atualizadas com sucesso:', {
      access_token: '****' + formattedCredentials.access_token.slice(-4),
      public_key: '****' + formattedCredentials.public_key.slice(-4)
    })
  } catch (error) {
    console.error('Erro ao atualizar credenciais:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMercadoPagoCredentials()