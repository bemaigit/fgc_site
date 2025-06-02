import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Excluir um preço específico por categoria
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string, priceId: string } }
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

    // Obter o ID do evento e o ID do preço
    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const params = await context.params;
    const eventId = params.id;
    const priceId = params.priceId;

    console.log(`[API DELETE] Excluindo preço por categoria - eventId: ${eventId}, priceId: ${priceId}`);

    // Verificar se o evento existe (pode ser ID ou slug)
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { slug: eventId }
        ]
      }
    });

    if (!event) {
      console.log(`[API DELETE] Evento não encontrado - eventId: ${eventId}`);
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o preço existe de uma forma mais flexível
    console.log(`[API DELETE] Buscando preço com ID: ${priceId}`);
    const price = await prisma.eventPricingByCategory.findFirst({
      where: { id: priceId }
    });

    if (!price) {
      console.log(`[API DELETE] Preço não encontrado - priceId: ${priceId}`);
      
      // Tentar buscar todos os preços para este evento para depuração
      const allPrices = await prisma.eventPricingByCategory.findMany({
        where: { eventId: event.id }
      });
      
      console.log(`[API DELETE] Preços encontrados para o evento (${allPrices.length}):`, 
        allPrices.map(p => ({ id: p.id, modalityId: p.modalityId, categoryId: p.categoryId })));
      
      return NextResponse.json(
        { error: 'Preço não encontrado', debug: { priceId, eventId: event.id, allPrices: allPrices.length } },
        { status: 404 }
      );
    }

    // Verificar se o preço pertence ao evento
    if (price.eventId !== event.id) {
      console.log(`[API DELETE] Preço não pertence ao evento - eventId: ${event.id}, priceId: ${priceId}`);
      return NextResponse.json(
        { error: 'Preço não pertence ao evento especificado' },
        { status: 403 }
      );
    }

    // Excluir o preço
    try {
      await prisma.eventPricingByCategory.delete({
        where: { id: priceId }
      });
      
      console.log(`[API DELETE] Preço excluído com sucesso - priceId: ${priceId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Preço excluído com sucesso'
      });
    } catch (deleteError) {
      console.error(`[API DELETE] Erro ao excluir preço:`, deleteError);
      return NextResponse.json(
        { error: 'Erro ao excluir preço do banco de dados', details: String(deleteError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API DELETE] Erro ao excluir preço por categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir preço por categoria', details: String(error) },
      { status: 500 }
    );
  }
}
