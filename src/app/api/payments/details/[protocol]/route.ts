import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/format-utils"

export async function GET(
  request: Request,
  { params }: { params: { protocol: string } }
) {
  try {
    const { protocol } = params
    
    // Buscar transação no banco de dados
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        protocol
      },
      include: {
        Athlete: true
      }
    })
    
    // Se encontrou a transação no banco, retornar os dados reais
    if (transaction) {
      // Mapear método de pagamento para exibição
      const methodMap: Record<string, string> = {
        PIX: "PIX",
        CREDIT_CARD: "Cartão de Crédito",
        BOLETO: "Boleto Bancário"
      }

      return NextResponse.json({
        protocol: transaction.protocol,
        name: transaction.Athlete?.name || "Nome não disponível",
        email: transaction.Athlete?.email || "Email não disponível",
        modalityName: transaction.metadata?.modalityName as string || "Não especificado",
        categoryName: transaction.metadata?.categoryName as string || "Não especificado",
        genderName: transaction.metadata?.genderName as string || "Não especificado",
        tierName: transaction.metadata?.tierName as string || "Padrão",
        price: Number(transaction.amount),
        paymentMethod: transaction.paymentMethod,
        paymentDate: transaction.paidAt?.toISOString() || transaction.createdAt.toISOString(),
        status: transaction.status
      })
    }
    
    // Caso não encontre no banco, simular dados para demonstração
    return simulatePaymentDetailsByProtocol(protocol)
  } catch (error) {
    console.error('Erro ao buscar detalhes do pagamento:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar detalhes do pagamento' },
      { status: 500 }
    )
  }
}

// Função para simular detalhes de pagamento por protocolo (para demonstração)
function simulatePaymentDetailsByProtocol(protocol: string) {
  // Extrair informações do protocolo (formato: EVE2025-123456)
  const eventCode = protocol.substring(0, 3)
  
  // Gerar dados fictícios baseados no protocolo
  const paymentDetails = {
    protocol,
    name: `Participante ${protocol.substring(protocol.length - 4)}`,
    email: `participante${protocol.substring(protocol.length - 4)}@exemplo.com`,
    modalityName: getRandomModality(),
    categoryName: getRandomCategory(),
    genderName: getRandomGender(),
    tierName: getRandomTier(),
    price: Math.floor(Math.random() * 20000) / 100 + 50, // Valor entre R$ 50 e R$ 250
    paymentMethod: getRandomPaymentMethod(),
    paymentDate: new Date().toISOString(),
    status: 'confirmed',
    eventCode // Incluir o código do evento nos detalhes
  }
  
  return NextResponse.json(paymentDetails)
}

// Funções auxiliares para gerar dados aleatórios
function getRandomModality() {
  const modalities = ['Jiu-Jitsu', 'Submission', 'Wrestling', 'MMA', 'Grappling']
  return modalities[Math.floor(Math.random() * modalities.length)]
}

function getRandomCategory() {
  const categories = ['Adulto', 'Master', 'Juvenil', 'Infantil', 'Sênior']
  return categories[Math.floor(Math.random() * categories.length)]
}

function getRandomGender() {
  const genders = ['Masculino', 'Feminino']
  return genders[Math.floor(Math.random() * genders.length)]
}

function getRandomTier() {
  const tiers = ['Lote Promocional', 'Lote 1', 'Lote 2', 'Lote Final']
  return tiers[Math.floor(Math.random() * tiers.length)]
}

function getRandomPaymentMethod() {
  const methods = ['credit_card', 'pix', 'boleto']
  return methods[Math.floor(Math.random() * methods.length)]
}
