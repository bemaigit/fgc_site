import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o ID do evento da URL
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 });
    }

    console.log(`Debugging preços para evento ID: ${eventId}`);

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, slug: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    console.log(`Evento encontrado: ${event.title} (${event.id}, slug: ${event.slug})`);

    // Buscar preços por categoria diretamente com SQL nativo
    const rawPrices = await prisma.$queryRaw`
      SELECT * FROM "EventPricingByCategory"
      WHERE "eventId" = ${eventId}
    `;

    // Buscar cupons de desconto para o evento
    const rawCoupons = await prisma.$queryRaw`
      SELECT * FROM "EventDiscountCoupon"
      WHERE "eventId" = ${eventId}
    `;

    // Verificar registros no banco de dados relacionados ao evento
    const relatedRecords = {
      pricingTiers: await prisma.eventPricingTier.count({ where: { eventId } }),
      registrations: await prisma.registration.count({ where: { eventId } }),
      modalities: 0 // Removida contagem que causava erro
    };

    return NextResponse.json({
      event,
      pricingByCategory: {
        count: Array.isArray(rawPrices) ? rawPrices.length : 0,
        data: rawPrices
      },
      discountCoupons: {
        count: Array.isArray(rawCoupons) ? rawCoupons.length : 0,
        data: rawCoupons
      },
      relatedRecords,
      message: "Debugging de preços concluído com sucesso"
    });
  } catch (error) {
    console.error('Erro ao depurar preços:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar informações de preços', 
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}
