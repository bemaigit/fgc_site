import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API para corrigir problemas de associação entre preços, cupons e eventos
 * ATENÇÃO: Esta API deve ser usada apenas para propósitos de debug e correção
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { 
      eventId, 
      targetEventId,
      fixPrices = true, 
      fixCoupons = true 
    } = body;

    if (!eventId || !targetEventId) {
      return NextResponse.json({ 
        error: 'IDs de evento não fornecidos',
        required: 'eventId e targetEventId são obrigatórios'
      }, { status: 400 });
    }

    console.log(`Iniciando correção de dados para evento: ${eventId}, destino: ${targetEventId}`);

    // Verificar se os eventos existem
    const [sourceEvent, targetEvent] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true } }),
      prisma.event.findUnique({ where: { id: targetEventId }, select: { id: true, title: true } })
    ]);

    if (!sourceEvent) {
      return NextResponse.json({ error: 'Evento de origem não encontrado' }, { status: 404 });
    }

    if (!targetEvent) {
      return NextResponse.json({ error: 'Evento de destino não encontrado' }, { status: 404 });
    }

    console.log(`Eventos verificados: 
      - Origem: ${sourceEvent.title} (${sourceEvent.id})
      - Destino: ${targetEvent.title} (${targetEvent.id})
    `);

    const results = {
      prices: { before: 0, after: 0 },
      coupons: { before: 0, after: 0 }
    };

    // 1. Corrigir preços por categoria
    if (fixPrices) {
      // Verificar preços antes
      const beforePrices = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "EventPricingByCategory" WHERE "eventId" = ${targetEventId}
      `;
      results.prices.before = Number((beforePrices as any[])[0]?.count || 0);

      // Atualizar associação
      if (eventId !== targetEventId) {
        await prisma.$executeRaw`
          UPDATE "EventPricingByCategory"
          SET "eventId" = ${targetEventId}
          WHERE "eventId" = ${eventId}
        `;
      }

      // Verificar se há preços sem associação ou com associação incorreta
      await prisma.$executeRaw`
        UPDATE "EventPricingByCategory"
        SET "eventId" = ${targetEventId}
        WHERE "eventId" IS NULL OR "eventId" = ''
      `;

      // Verificar preços depois
      const afterPrices = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "EventPricingByCategory" WHERE "eventId" = ${targetEventId}
      `;
      results.prices.after = Number((afterPrices as any[])[0]?.count || 0);
    }

    // 2. Corrigir cupons de desconto
    if (fixCoupons) {
      // Verificar cupons antes
      const beforeCoupons = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "EventDiscountCoupon" WHERE "eventId" = ${targetEventId}
      `;
      results.coupons.before = Number((beforeCoupons as any[])[0]?.count || 0);

      // Atualizar associação
      if (eventId !== targetEventId) {
        await prisma.$executeRaw`
          UPDATE "EventDiscountCoupon"
          SET "eventId" = ${targetEventId}
          WHERE "eventId" = ${eventId}
        `;
      }

      // Verificar se há cupons sem associação ou com associação incorreta
      await prisma.$executeRaw`
        UPDATE "EventDiscountCoupon"
        SET "eventId" = ${targetEventId}
        WHERE "eventId" IS NULL OR "eventId" = ''
      `;

      // Verificar cupons depois
      const afterCoupons = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "EventDiscountCoupon" WHERE "eventId" = ${targetEventId}
      `;
      results.coupons.after = Number((afterCoupons as any[])[0]?.count || 0);
    }

    return NextResponse.json({
      success: true,
      message: "Correção de associações concluída com sucesso",
      results,
      events: {
        source: sourceEvent,
        target: targetEvent
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir associações:', error);
    return NextResponse.json({ 
      error: 'Erro ao corrigir associações', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
