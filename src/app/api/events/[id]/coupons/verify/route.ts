import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para validação do código do cupom
const couponVerifySchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres'),
  modalityId: z.string().optional(),
  categoryId: z.string().optional(),
  genderId: z.string().optional(),
  tierId: z.string().optional()
})

// Verificar um cupom de desconto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Acessar o ID do evento de forma segura
    const eventId = params.id
    
    console.log('API Verificar Cupom - POST - ID do evento:', eventId)
    
    // Extrair dados do corpo da requisição
    const body = await request.json()
    
    // Validar dados
    const validationResult = couponVerifySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    
    // Verificar se o evento existe (pode ser ID ou slug)
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { slug: eventId }
        ]
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o cupom existe e está válido
    const now = new Date()
    
    const cupons = await prisma.$queryRaw`
      SELECT 
        edc.id, edc.code, edc.discount, edc."maxUses",
        edc."startDate", edc."endDate",
        edc."modalityId", edc."categoryId", edc."genderId",
        COUNT(ecu.id) as used_count
      FROM "EventDiscountCoupon" edc
      LEFT JOIN "EventCouponUsage" ecu ON ecu."couponId" = edc.id
      WHERE edc."eventId" = ${event.id}
      AND edc.code = ${data.code}
      AND edc.active = true
      AND edc."startDate" <= ${now}
      AND edc."endDate" >= ${now}
      GROUP BY edc.id
    `;

    // Se não encontrou o cupom ou ele não está ativo
    if ((cupons as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cupom não encontrado ou expirado' },
        { status: 404 }
      )
    }

    const coupon = (cupons as any[])[0]
    
    // Verificar se o cupom atingiu o limite de usos
    if (Number(coupon.used_count) >= Number(coupon.maxUses)) {
      return NextResponse.json(
        { error: 'Cupom atingiu o limite de usos' },
        { status: 400 }
      )
    }
    
    // Verificar se o cupom é válido para a modalidade, categoria e gênero selecionados
    if (data.modalityId && coupon.modalityId && coupon.modalityId !== data.modalityId) {
      return NextResponse.json(
        { error: 'Cupom não é válido para a modalidade selecionada' },
        { status: 400 }
      )
    }
    
    if (data.categoryId && coupon.categoryId && coupon.categoryId !== data.categoryId) {
      return NextResponse.json(
        { error: 'Cupom não é válido para a categoria selecionada' },
        { status: 400 }
      )
    }
    
    if (data.genderId && coupon.genderId && coupon.genderId !== data.genderId) {
      return NextResponse.json(
        { error: 'Cupom não é válido para o gênero selecionado' },
        { status: 400 }
      )
    }
    
    // Retornar os dados do cupom
    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discount: Number(coupon.discount),
        maxUses: Number(coupon.maxUses),
        usedCount: Number(coupon.used_count),
        valid: true
      }
    })
  } catch (error) {
    console.error('Erro ao verificar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar cupom' },
      { status: 500 }
    )
  }
}
