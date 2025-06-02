import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// API para buscar lotes de preço de um evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Removida verificação de autenticação para permitir visualização pública
    // A autenticação será exigida apenas no momento da inscrição
    // Isso permite que usuários não logados vejam os preços e opções de lotes

    // Acessar o ID ou slug de forma segura
    const eventIdOrSlug = params.id
    console.log('API Pricing Tiers - GET - ID ou slug do evento:', eventIdOrSlug)

    // Buscar evento por ID ou slug
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventIdOrSlug },
          { slug: eventIdOrSlug }
        ]
      },
      include: {
        EventPricingTier: {
          select: {
            id: true,
            name: true,
            price: true,
            startDate: true,
            endDate: true,
            endTime: true,
            maxEntries: true,
            active: true
          },
          where: {
            active: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Processar os lotes para garantir que não haja erros de serialização BigInt
    const pricingTiers = event.EventPricingTier.map(tier => ({
      id: tier.id,
      name: tier.name,
      price: Number(tier.price),
      startDate: tier.startDate,
      endDate: tier.endDate,
      endTime: tier.endTime,
      maxEntries: tier.maxEntries ? Number(tier.maxEntries) : null
    }))

    return NextResponse.json({
      success: true,
      data: pricingTiers
    })
  } catch (error) {
    console.error('Erro ao buscar lotes de preço:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar lotes de preço' },
      { status: 500 }
    )
  }
}
