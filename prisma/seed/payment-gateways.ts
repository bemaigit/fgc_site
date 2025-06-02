import { PrismaClient, PaymentProvider } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const gateways = [
  {
    id: randomUUID(),
    name: 'Mercado Pago',
    provider: 'MERCADO_PAGO',
    active: true,
    priority: 1,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB', 'EVENT'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/mercadopago'
    },
    credentials: {
      sandbox_access_token: process.env.MP_SANDBOX_ACCESS_TOKEN || '',
      sandbox_public_key: process.env.MP_SANDBOX_PUBLIC_KEY || '',
      access_token: process.env.MP_ACCESS_TOKEN || '',
      public_key: process.env.MP_PUBLIC_KEY || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'PagSeguro',
    provider: 'PAGSEGURO',
    active: true,
    priority: 2,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB', 'EVENT'],
    checkoutType: 'TRANSPARENT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/pagseguro'
    },
    credentials: {
      email: process.env.PAGSEGURO_EMAIL || '',
      token: process.env.PAGSEGURO_TOKEN || '',
      sandbox_email: process.env.PAGSEGURO_SANDBOX_EMAIL || '',
      sandbox_token: process.env.PAGSEGURO_SANDBOX_TOKEN || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'Asaas',
    provider: 'ASAAS',
    active: true,
    priority: 3,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/asaas'
    },
    credentials: {
      apiKey: process.env.ASAAS_API_KEY || '',
      sandbox_api_key: process.env.ASAAS_SANDBOX_API_KEY || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'PagHiper',
    provider: 'PAGHIPER',
    active: true,
    priority: 4,
    allowedMethods: ['PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/paghiper'
    },
    credentials: {
      apiKey: process.env.PAGHIPER_API_KEY || '',
      token: process.env.PAGHIPER_TOKEN || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'Appmax',
    provider: 'APPMAX',
    active: true,
    priority: 5,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB', 'EVENT'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/appmax'
    },
    credentials: {
      apiKey: process.env.APPMAX_API_KEY || '',
      apiSecret: process.env.APPMAX_API_SECRET || '',
      sandbox_api_key: process.env.APPMAX_SANDBOX_API_KEY || '',
      sandbox_api_secret: process.env.APPMAX_SANDBOX_API_SECRET || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'Pagar.me',
    provider: 'PAGARME',
    active: true,
    priority: 6,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB', 'EVENT'],
    checkoutType: 'TRANSPARENT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/pagarme'
    },
    credentials: {
      apiKey: process.env.PAGARME_API_KEY || '',
      sandbox_api_key: process.env.PAGARME_SANDBOX_API_KEY || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'Yampi',
    provider: 'YAMPI',
    active: true,
    priority: 7,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/yampi'
    },
    credentials: {
      apiKey: process.env.YAMPI_API_KEY || '',
      apiSecret: process.env.YAMPI_API_SECRET || '',
      sandbox_api_key: process.env.YAMPI_SANDBOX_API_KEY || '',
      sandbox_api_secret: process.env.YAMPI_SANDBOX_API_SECRET || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'InfinitePay',
    provider: 'INFINITE_PAY',
    active: true,
    priority: 8,
    allowedMethods: ['CREDIT_CARD', 'PIX'],
    entityTypes: ['ATHLETE', 'CLUB'],
    checkoutType: 'REDIRECT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/infinitepay'
    },
    credentials: {
      apiKey: process.env.INFINITE_PAY_API_KEY || '',
      apiSecret: process.env.INFINITE_PAY_API_SECRET || '',
      sandbox_api_key: process.env.INFINITE_PAY_SANDBOX_API_KEY || '',
      sandbox_api_secret: process.env.INFINITE_PAY_SANDBOX_API_SECRET || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  },
  {
    id: randomUUID(),
    name: 'Getnet',
    provider: 'GETNET',
    active: true,
    priority: 9,
    allowedMethods: ['CREDIT_CARD', 'PIX', 'BOLETO'],
    entityTypes: ['ATHLETE', 'CLUB', 'EVENT'],
    checkoutType: 'TRANSPARENT',
    sandbox: true,
    webhook: {
      retryAttempts: 3,
      retryInterval: 5000
    },
    urls: {
      success: 'https://fgc.org.br/pagamento/sucesso',
      failure: 'https://fgc.org.br/pagamento/falha',
      notification: 'https://fgc.org.br/api/webhooks/getnet'
    },
    credentials: {
      apiKey: process.env.GETNET_API_KEY || '',
      apiSecret: process.env.GETNET_API_SECRET || '',
      sandbox_api_key: process.env.GETNET_SANDBOX_API_KEY || '',
      sandbox_api_secret: process.env.GETNET_SANDBOX_API_SECRET || ''
    },
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM'
  }
]

async function seed() {
  console.log('🌱 Seeding payment gateways...')
  
  for (const gateway of gateways) {
    await prisma.paymentGatewayConfig.upsert({
      where: { id: gateway.id },
      update: gateway,
      create: gateway
    })
  }

  console.log('✅ Payment gateways seeded!')
}

seed()
  .catch((error) => {
    console.error('❌ Error seeding payment gateways:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
