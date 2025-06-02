import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto';

// Schema para validação de preço por categoria
const categoryPriceSchema = z.object({
  modalityId: z.string(),
  categoryId: z.string(),
  genderId: z.string(),
  tierId: z.string(),
  price: z.number().min(0, 'Preço não pode ser negativo')
})

// Schema para validação de array de preços
const categoryPricesArraySchema = z.array(categoryPriceSchema);

// Listar preços por categoria para um evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair o ID do evento dos parâmetros de forma segura
    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const paramsAsync = await params;
    const eventId = paramsAsync.id;
    
    console.log(`[GET] Buscando preços por categoria para evento ID: ${eventId}`);

    // Nota: Este endpoint agora é público para permitir visualização dos preços sem autenticação
    // A autenticação será exigida apenas no momento da inscrição
    
    // Listar algumas entradas na tabela para debug
    console.log('Listando entradas da tabela EventPricingByCategory para debug:')
    try {
      const allPrices = await prisma.$queryRaw`
        SELECT id, "eventId", "modalityId", "categoryId", "genderId", price FROM "EventPricingByCategory" LIMIT 10
      `;
      console.log('Amostra de entradas:', allPrices);
    } catch (err) {
      console.error('Erro ao listar entradas de exemplo:', err);
    }

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      console.log(`Evento não encontrado: ${eventId}`);
      // Mesmo quando não encontramos o evento, retornamos um array vazio com status 200
      // para evitar erros na interface e permitir criação de novos preços
      return NextResponse.json({ data: [], success: true });
    }

    console.log(`Evento encontrado: ${event.title} (${event.id})`);

    // Buscar informações adicionais que serão necessárias para enriquecer os resultados
    const [allModalities, allCategories, allGenders, allTiers] = await Promise.all([
      prisma.eventModality.findMany(),
      prisma.eventCategory.findMany(),
      prisma.gender.findMany(),
      prisma.eventPricingTier.findMany({
        where: { eventId: event.id }
      })
    ]);

    // Buscar preços por categoria usando SQL nativo para garantir compatibilidade
    const rawPrices = await prisma.$queryRaw`
      SELECT * FROM "EventPricingByCategory"
      WHERE "eventId" = ${event.id}
    `;
    
    console.log(`Encontrados ${Array.isArray(rawPrices) ? rawPrices.length : 0} preços com SQL`);
    
    if (!Array.isArray(rawPrices)) {
      console.log('Formato inválido de resposta (não é array)');
      return NextResponse.json({ data: [], success: true });
    }
    
    // Formatar resultados
    const formattedPrices = rawPrices.map((price: any) => {
      const modality = allModalities.find(m => m.id === price.modalityId);
      const category = allCategories.find(c => c.id === price.categoryId);
      const gender = allGenders.find(g => g.id === price.genderId);
      const tier = allTiers.find(t => t.id === price.tierId);
      
      return {
        id: price.id,
        eventId: price.eventId,
        modalityId: price.modalityId,
        categoryId: price.categoryId,
        genderId: price.genderId,
        tierId: price.tierId,
        price: Number(price.price),
        modalityName: modality?.name || 'Modalidade',
        categoryName: category?.name || 'Categoria',
        genderName: gender?.name || 'Gênero',
        tierName: tier?.name || 'Lote'
      };
    });
    
    console.log(`Retornando ${formattedPrices.length} preços formatados`);
    return NextResponse.json({ data: formattedPrices, success: true });

  } catch (error) {
    console.error('Erro ao buscar preços por categoria:', error);
    return NextResponse.json({
      error: 'Erro ao buscar preços por categoria', 
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 });
  }
}

// Criar novo preço por categoria
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const paramsAsync = await context.params;
    const eventId = paramsAsync.id;
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Validar dados recebidos
    const requestData = await request.json();
    const validationResult = categoryPriceSchema.safeParse(requestData);

    if (!validationResult.success) {
      console.error('Dados inválidos para preço por categoria:', validationResult.error);
      return NextResponse.json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Verificar se já existe preço para essa combinação
    const existingPrice = await prisma.eventPricingByCategory.findFirst({
      where: {
        eventId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        genderId: data.genderId,
        tierId: data.tierId
      }
    });

    if (existingPrice) {
      // Atualizar o preço existente
      const updatedPrice = await prisma.eventPricingByCategory.update({
        where: { id: existingPrice.id },
        data: { price: data.price }
      });

      return NextResponse.json({
        success: true,
        message: 'Preço atualizado com sucesso',
        price: updatedPrice
      });
    }

    // Criar novo preço por categoria
    const newPrice = await prisma.eventPricingByCategory.create({
      data: {
        id: crypto.randomUUID(),
        eventId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        genderId: data.genderId,
        tierId: data.tierId,
        price: data.price,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Retornar com detalhes para a interface
    // Buscar informações adicionais para nomes
    const [modality, category, gender, tier] = await Promise.all([
      prisma.eventModality.findUnique({ where: { id: data.modalityId } }),
      prisma.eventCategory.findUnique({ where: { id: data.categoryId } }),
      prisma.gender.findUnique({ where: { id: data.genderId } }),
      prisma.eventPricingTier.findUnique({ where: { id: data.tierId } })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Preço criado com sucesso',
      price: {
        ...newPrice,
        modalityName: modality?.name || 'Modalidade',
        categoryName: category?.name || 'Categoria',
        genderName: gender?.name || 'Gênero',
        tierName: tier?.name || 'Lote'
      }
    });

  } catch (error) {
    console.error('Erro ao criar preço por categoria:', error);
    return NextResponse.json({
      error: 'Erro ao criar preço por categoria',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Excluir preço por categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const paramsAsync = await params;
    const eventId = paramsAsync.id;

    // Obter o ID do preço a ser excluído da URL
    const url = new URL(request.url);
    const priceId = url.searchParams.get('priceId');

    if (!priceId) {
      return NextResponse.json({ error: 'ID do preço não fornecido' }, { status: 400 });
    }

    // Verificar se o preço existe para este evento
    const price = await prisma.eventPricingByCategory.findFirst({
      where: {
        id: priceId,
        eventId
      }
    });

    if (!price) {
      return NextResponse.json({ error: 'Preço não encontrado' }, { status: 404 });
    }

    // Excluir o preço
    await prisma.eventPricingByCategory.delete({
      where: { id: priceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Preço excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir preço por categoria:', error);
    return NextResponse.json({
      error: 'Erro ao excluir preço por categoria',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
