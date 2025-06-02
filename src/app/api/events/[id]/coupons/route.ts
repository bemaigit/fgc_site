import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema para validação de cupom
const couponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres'),
  discount: z.number().min(1, 'Desconto deve ser maior que 0').max(100, 'Desconto não pode ser maior que 100%'),
  modalityId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  genderId: z.string().optional().nullable(),
  maxUses: z.number().min(1, 'Número máximo de usos deve ser pelo menos 1'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date())
})

// Listar cupons de desconto para um evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar autenticação
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      console.log('API Cupons - GET - Acesso não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Acessar o ID de forma segura em Next.js 14+
    const eventId = await params.id
    
    console.log('API Cupons - GET - ID do evento:', eventId)
    
    // Listar todas as entradas na tabela para debug
    console.log('Listando todas as entradas da tabela EventDiscountCoupon para debug:')
    try {
      const allCoupons = await prisma.$queryRaw`
        SELECT id, "eventId", code FROM "EventDiscountCoupon" LIMIT 10
      `;
      console.log('Todas as entradas:', allCoupons);
    } catch (err) {
      console.error('Erro ao listar todas as entradas:', err);
    }

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      console.log(`Evento não encontrado: ${eventId}`);
      // Mesmo quando não encontramos o evento, retornamos um array vazio com status 200
      // para evitar erros na interface
      return NextResponse.json({ data: [], success: true });
    }

    console.log(`Evento encontrado: ${event.title} (${event.id})`);

    // Buscar cupons de desconto direto com SQL nativo para melhor compatibilidade
    const rawCoupons = await prisma.$queryRaw`
      SELECT 
        edc.id, edc.code, edc.discount, edc."maxUses",
        edc."startDate", edc."endDate",
        edc."modalityId", edc."categoryId", edc."genderId",
        edc.active, edc."eventId",
        COUNT(ecu.id) as used_count 
      FROM "EventDiscountCoupon" edc
      LEFT JOIN "EventCouponUsage" ecu ON ecu."couponId" = edc.id
      WHERE edc."eventId" = ${event.id}
      GROUP BY edc.id
    `;

    if (!Array.isArray(rawCoupons)) {
      console.log('Formato inválido de resposta (não é array)');
      return NextResponse.json({ data: [], success: true });
    }

    console.log(`Encontrados ${rawCoupons.length} cupons para o evento`);

    // Buscar modalidades, categorias e gêneros para enriquecer os dados
    const [modalities, categories, genders] = await Promise.all([
      prisma.eventModality.findMany(),
      prisma.eventCategory.findMany(),
      prisma.gender.findMany()
    ]);

    // Formatar os cupons com nomes das entidades relacionadas
    const formattedCoupons = rawCoupons.map((coupon: any) => {
      // Encontrar nomes relacionados
      const modality = modalities.find(m => m.id === coupon.modalityId);
      const category = categories.find(c => c.id === coupon.categoryId);
      const gender = genders.find(g => g.id === coupon.genderId);

      return {
        id: coupon.id,
        code: coupon.code,
        discount: Number(coupon.discount),
        maxUses: Number(coupon.maxUses),
        usedCount: Number(coupon.used_count || 0),
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        active: coupon.active,
        modalityId: coupon.modalityId,
        categoryId: coupon.categoryId,
        genderId: coupon.genderId,
        modalityName: modality?.name || null,
        categoryName: category?.name || null,
        genderName: gender?.name || null
      };
    });

    return NextResponse.json({ 
      data: formattedCoupons, 
      success: true 
    });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cupons' },
      { status: 500 }
    )
  }
}

// Criar novo cupom de desconto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      )
    }

    // Acessar o ID de forma segura
    const id = await params.id
    
    console.log('API Cupons - POST - ID do evento:', id)
    
    // Verificar se o evento existe (pode ser ID ou slug)
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Extrair dados do corpo da requisição
    const body = await request.json()
    
    // Validar dados
    const validationResult = couponSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const data = validationResult.data
    
    // Converter dados para snake_case
    const snakeCaseData = {
      code: data.code,
      discount: data.discount,
      modalityId: data.modalityId || null,
      categoryId: data.categoryId || null,
      genderId: data.genderId || null,
      maxUses: data.maxUses,
      startDate: data.startDate,
      endDate: data.endDate
    }

    // Verificar se já existe um cupom com o mesmo código para este evento
    const existingCoupon = await prisma.$queryRaw`
      SELECT id FROM "EventDiscountCoupon"
      WHERE "eventId" = ${event.id} AND code = ${snakeCaseData.code}
    `;

    if ((existingCoupon as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um cupom com este código para este evento' },
        { status: 400 }
      )
    }

    // Criar novo cupom
    const startDate = new Date(snakeCaseData.startDate)
    const endDate = new Date(snakeCaseData.endDate)
    const couponId = `${event.id}-${snakeCaseData.code}`
    const now = new Date()
    
    await prisma.$executeRaw`
      INSERT INTO "EventDiscountCoupon" (
        id, "eventId", code, discount, "maxUses",
        "startDate", "endDate", "modalityId", "categoryId", "genderId",
        active, "createdAt", "updatedAt"
      ) VALUES (
        ${couponId}, ${event.id}, ${snakeCaseData.code}, ${snakeCaseData.discount}, ${snakeCaseData.maxUses},
        ${startDate}, ${endDate}, ${snakeCaseData.modalityId}, ${snakeCaseData.categoryId}, ${snakeCaseData.genderId},
        true, ${now}, ${now}
      )
    `;

    // Buscar o cupom recém-criado
    const newCoupon = await prisma.$queryRaw`
      SELECT 
        edc.id, edc.code, edc.discount, edc."maxUses" as max_uses, 
        edc."startDate" as start_date, edc."endDate" as end_date,
        edc."modalityId" as modality_id, edc."categoryId" as category_id, 
        edc."genderId" as gender_id, edc.active,
        em.name as modality_name, ec.name as category_name, g.name as gender_name
      FROM "EventDiscountCoupon" edc
      LEFT JOIN "EventModality" em ON edc."modalityId" = em.id
      LEFT JOIN "EventCategory" ec ON edc."categoryId" = ec.id
      LEFT JOIN "Gender" g ON edc."genderId" = g.id
      WHERE edc.id = ${couponId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: (newCoupon as any[])[0].id,
        code: (newCoupon as any[])[0].code,
        discount: Number((newCoupon as any[])[0].discount),
        maxUses: Number((newCoupon as any[])[0].max_uses),
        startDate: (newCoupon as any[])[0].start_date,
        endDate: (newCoupon as any[])[0].end_date,
        modalityId: (newCoupon as any[])[0].modality_id,
        categoryId: (newCoupon as any[])[0].category_id,
        genderId: (newCoupon as any[])[0].gender_id,
        active: (newCoupon as any[])[0].active,
        modalityName: (newCoupon as any[])[0].modality_name || null,
        categoryName: (newCoupon as any[])[0].category_name || null,
        genderName: (newCoupon as any[])[0].gender_name || null,
        usedCount: 0
      }
    })
  } catch (error) {
    console.error('Erro ao criar cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cupom' },
      { status: 500 }
    )
  }
}

// Excluir cupom de desconto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      )
    }

    // Acessar o ID de forma segura
    const id = await params.id
    
    console.log('API Cupons - DELETE - ID do evento:', id)
    
    // Verificar se o evento existe (pode ser ID ou slug)
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Extrair ID do cupom da URL
    const url = new URL(request.url)
    const couponId = url.searchParams.get('couponId')
    
    if (!couponId) {
      return NextResponse.json(
        { error: 'ID do cupom não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se o cupom existe e pertence ao evento
    const coupon = await prisma.$queryRaw`
      SELECT * FROM "EventDiscountCoupon"
      WHERE id = ${couponId} AND "eventId" = ${event.id}
    `;

    if ((coupon as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Cupom não encontrado ou não pertence a este evento' },
        { status: 404 }
      )
    }

    // Excluir o cupom
    await prisma.$executeRaw`
      DELETE FROM "EventDiscountCoupon" 
      WHERE id = ${couponId} AND "eventId" = ${event.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'Cupom excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir cupom:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir cupom' },
      { status: 500 }
    )
  }
}
