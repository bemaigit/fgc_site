import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('API Test: Recebendo requisição POST para testar criação de evento')
  try {
    const body = await request.json()
    console.log('API Test: Dados recebidos:', body)

    // Extrai os lotes de preços do payload
    const { EventPricingTier, ...eventData } = body

    // Simula um usuário para teste
    const testUserId = 'clz6xmfqp0000v8a9dqjvxwbq' // Substitua por um ID válido do seu banco

    // Cria o evento com os lotes de preços
    console.log('API Test: Simulando criação de evento no banco de dados')
    
    // Não vamos realmente criar o evento no banco, apenas simular a resposta
    const mockEvent = {
      id: 'test-event-id',
      ...eventData,
      userId: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      EventPricingTier: EventPricingTier ? EventPricingTier.map((tier: Record<string, any>, index: number) => ({
        id: `test-tier-${index}`,
        ...tier,
        eventId: 'test-event-id',
        createdAt: new Date(),
        updatedAt: new Date()
      })) : []
    }

    console.log('API Test: Evento simulado com sucesso:', mockEvent)
    return NextResponse.json({ 
      success: true, 
      message: 'Teste de criação de evento simulado com sucesso',
      data: mockEvent 
    })
  } catch (error) {
    console.error('API Test: Erro ao simular criação de evento:', error)
    // Garante que o erro é um objeto antes de tentar acessá-lo
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Erro desconhecido' }

    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorObj },
      { status: 500 }
    )
  }
}
