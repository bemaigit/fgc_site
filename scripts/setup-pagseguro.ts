import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function setupPagSeguroConfig() {
  try {
    // Verificar se já existe uma configuração para o PagSeguro
    const existingConfig = await prisma.paymentGatewayConfig.findFirst({
      where: {
        provider: 'PAGSEGURO'
      }
    })

    if (existingConfig) {
      console.log('Configuração do PagSeguro já existe. Atualizando...')
      
      // Atualizar a configuração existente
      await prisma.paymentGatewayConfig.update({
        where: { id: existingConfig.id },
        data: {
          active: true,
          sandbox: true,
          credentials: {
            token: 'a8baa8b4-d2c7-4711-b846-d325abee9a80e4e002694e258c34b3b232b75cdafae5733c-e681-497a-8616-c5ef32509bcb'
          },
          urls: {
            checkout: 'https://sandbox.pagseguro.uol.com.br/checkout',
            notification: 'https://ws.sandbox.pagseguro.uol.com.br/v3/transactions/notifications',
            session: 'https://ws.sandbox.pagseguro.uol.com.br/v2/sessions'
          },
          updatedAt: new Date()
        }
      })
      
      console.log('Configuração do PagSeguro atualizada com sucesso!')
    } else {
      console.log('Criando nova configuração para o PagSeguro...')
      
      // Criar nova configuração
      await prisma.paymentGatewayConfig.create({
        data: {
          id: uuidv4(),
          name: 'PagSeguro Sandbox',
          provider: 'PAGSEGURO',
          active: true,
          priority: 1,
          allowedMethods: ['CREDIT_CARD', 'BOLETO', 'PIX'],
          entityTypes: ['EVENT_REGISTRATION', 'ATHLETE_MEMBERSHIP'],
          checkoutType: 'REDIRECT',
          sandbox: true,
          credentials: {
            token: 'a8baa8b4-d2c7-4711-b846-d325abee9a80e4e002694e258c34b3b232b75cdafae5733c-e681-497a-8616-c5ef32509bcb'
          },
          urls: {
            checkout: 'https://sandbox.pagseguro.uol.com.br/checkout',
            notification: 'https://ws.sandbox.pagseguro.uol.com.br/v3/transactions/notifications',
            session: 'https://ws.sandbox.pagseguro.uol.com.br/v2/sessions'
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          updatedBy: 'system'
        }
      })
      
      console.log('Configuração do PagSeguro criada com sucesso!')
    }
  } catch (error) {
    console.error('Erro ao configurar o PagSeguro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPagSeguroConfig()
  .then(() => console.log('Script finalizado'))
  .catch(console.error)
