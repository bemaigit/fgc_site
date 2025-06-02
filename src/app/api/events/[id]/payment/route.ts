import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// import { tempRegistrations } from '../register/temp/route'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// Em um ambiente de produção, isso seria armazenado em um banco de dados
// Para este exemplo, usamos um Map em memória para armazenar os pagamentos
const payments = new Map()
const registrations = new Map()

// Definir interfaces para os dados
interface PaymentData {
  registrationId: string;
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  installments?: number;
  cardDetails?: {
    number?: string;
    name?: string;
    expiry?: string;
    cvv?: string;
  };
}

interface RegistrationData {
  eventId: string;
  name: string;
  email: string;
  modalityId: string;
  categoryId: string;
  genderId: string;
  tierId: string;
  [key: string]: string | number | Date; // Para outros campos que possam existir
}

interface TierDetails {
  name: string;
  price: number;
}

interface PaymentResult {
  success: boolean;
  message: string;
  paymentId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = await Promise.resolve(params.id)
    const data = await request.json()
    
    // Validar dados
    if (!data.registrationId || !data.paymentMethod) {
      return NextResponse.json(
        { message: 'Dados de pagamento incompletos' },
        { status: 400 }
      )
    }
    
    // Buscar inscrição temporária
    const tempRegistration = registrations.get(data.registrationId)
    
    if (!tempRegistration) {
      return NextResponse.json(
        { message: 'Inscrição não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se a inscrição pertence ao evento correto
    if (tempRegistration.eventId !== eventId) {
      return NextResponse.json(
        { message: 'Inscrição não pertence a este evento' },
        { status: 403 }
      )
    }
    
    // Simular processamento de pagamento com gateway
    const paymentResult = await processPayment(data, tempRegistration)
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { message: paymentResult.message },
        { status: 400 }
      )
    }
    
    // Gerar protocolo único para a inscrição
    const protocol = generateProtocol(eventId)
    
    // Criar registro permanente da inscrição
    const registrationData = {
      ...tempRegistration,
      protocol,
      paymentId: paymentResult.paymentId,
      paymentMethod: data.paymentMethod,
      installments: data.installments || 1,
      status: 'confirmed',
      paidAt: new Date()
    }
    
    // Salvar inscrição permanente
    registrations.set(protocol, registrationData)
    
    // Remover inscrição temporária
    registrations.delete(data.registrationId)
    
    // Log para debug
    console.log(`Inscrição confirmada: ${protocol}`)
    
    return NextResponse.json({
      protocol,
      message: 'Pagamento processado com sucesso',
      status: 'confirmed'
    })
  } catch (error) {
    console.error('Erro ao processar pagamento:', error)
    return NextResponse.json(
      { message: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}

// Função para simular processamento de pagamento com gateway
async function processPayment(paymentData: PaymentData, registration: RegistrationData): Promise<PaymentResult> {
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Simular validação de dados do cartão (quando aplicável)
  if (paymentData.paymentMethod === 'credit_card') {
    // Em um ambiente real, validaríamos os dados do cartão com o gateway
    // e processaríamos o pagamento
    
    // Simular erro aleatório (10% de chance)
    if (Math.random() < 0.1) {
      return {
        success: false,
        message: 'Cartão recusado pela operadora'
      }
    }
  }
  
  // Gerar ID de pagamento
  const paymentId = crypto.randomUUID()
  
  // Simular registro de pagamento
  const tierDetails = getTierDetails(registration.eventId, registration.tierId)
  
  const paymentRecord = {
    id: paymentId,
    registrationId: paymentData.registrationId,
    method: paymentData.paymentMethod,
    amount: tierDetails.price,
    installments: paymentData.installments || 1,
    status: 'approved',
    createdAt: new Date()
  }
  
  // Salvar registro de pagamento
  payments.set(paymentId, paymentRecord)
  
  return {
    success: true,
    message: 'Pagamento aprovado',
    paymentId
  }
}

// Função para gerar protocolo único
function generateProtocol(eventId: string): string {
  // Formato: EVENTO-ANO-NÚMERO SEQUENCIAL
  const year = new Date().getFullYear()
  const randomPart = Math.floor(100000 + Math.random() * 900000) // 6 dígitos
  
  return `${eventId.substring(0, 3).toUpperCase()}${year}-${randomPart}`
}

// Função auxiliar para obter detalhes do lote
function getTierDetails(eventId: string, tierId: string): TierDetails {
  // Em um ambiente real, buscaríamos estas informações do banco de dados
  // com base no eventId e tierId
  
  // Mapeamento simulado de IDs para detalhes de lotes
  const tiers: Record<string, TierDetails> = {
    'tier1': { name: 'Lote Promocional', price: 99.90 },
    'tier2': { name: 'Lote 1', price: 129.90 },
    'tier3': { name: 'Lote 2', price: 149.90 },
    'free': { name: 'Gratuito', price: 0 },
    // Adicione mais conforme necessário
  }
  
  return tiers[tierId] || { name: 'Lote Desconhecido', price: 0 }
}
