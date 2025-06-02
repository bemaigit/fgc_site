const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PaymentProvider = {
  MERCADO_PAGO: "MERCADO_PAGO"
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
    let credentials = {}

    // Se as credenciais estiverem como string, tentar converter para objeto
    if (typeof gateway.credentials === 'string') {
      try {
        credentials = JSON.parse(gateway.credentials)
      } catch (e) {
        console.error('Erro ao fazer parse das credenciais:', e)
        return
      }
    } else if (gateway.credentials) {
      credentials = gateway.credentials
    }

    // Garantir que as credenciais estejam no formato correto
    const formattedCredentials = {
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