import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { Prisma } from '@prisma/client'

interface CreateEventRequest {
  title: string
  description: string
  slug?: string
  location: string
  locationUrl?: string
  startDate: string | Date
  endDate: string | Date
  registrationEnd: string | Date
  status: string
  published: boolean
  isFree: boolean
  addressDetails: string
  zipCode: string
  latitude: number
  longitude: number
  countryId?: string
  stateId?: string
  cityId?: string
  modalityIds: string[]
  categoryIds: string[]
  genderIds: string[]
  coverImage?: string
  posterImage?: string
  regulationPdf?: string
  resultsFile?: string
  pricingTiers?: Array<{
    id?: string
    name: string
    description?: string | null
    price: number | string
    startDate?: string | Date
    endDate?: string | Date
    maxEntries?: number | null
    active?: boolean
  }>
  EventPricingTier?: Array<{
    id?: string
    name: string
    description?: string | null
    price: number | string
    startDate?: string | Date
    endDate?: string | Date
    maxEntries?: number | null
    active?: boolean
  }>
  pricing?: {
    categoryPrices?: Array<{
      id?: string;
      modalityId: string;
      categoryId: string;
      genderId: string;
      price: number | string; 
      tierId: string; // Corrigido: É obrigatório
    }>;
    discountCoupons?: Array<{
      id?: string;
      code: string;
      discount: number;
      modalityId: string | null;
      categoryId: string | null;
      genderId: string | null;
      maxUses: number;
      startDate: string | Date | null;
      endDate: string | Date | null;
    }>;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const modality = searchParams.get('modality')
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const isPublic = searchParams.get('public') === 'true'
    const isPast = searchParams.get('past') === 'true'
    const showAll = searchParams.get('all') === 'true'

    console.log('Parâmetros recebidos:', { modality, category, gender, isPublic, isPast, showAll })

    // Verifica autenticação apenas se não for uma requisição pública
    const session = await getServerSession(authOptions)
    if (!isPublic && !session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Data atual para comparação
    const currentDate = new Date()
    
    // Eventos ordenados por data
    console.log('Buscando eventos com os seguintes filtros:', {
      published: isPublic ? true : undefined,
      isPast,
      showAll,
      ...(modality ? { modality } : {}),
      ...(category ? { category } : {}),
      ...(gender ? { gender } : {})
    })
    
    const events = await prisma.event.findMany({
      where: {
        // Se isPublic=true, filtra apenas eventos publicados
        published: isPublic ? true : undefined,
        // Filtro de data: se showAll=true, não filtra por data
        // Caso contrário, se isPast=true, busca eventos passados, senão busca eventos futuros
        ...(!showAll && isPast !== null && isPast !== undefined ? {
          endDate: isPast 
            ? { lt: currentDate } // Eventos passados (data de término menor que hoje)
            : { gte: currentDate } // Eventos futuros (data de término maior ou igual a hoje)
        } : {}),
        ...(modality ? { EventToModality: { some: { EventModality: { id: modality } } } } : {}),
        ...(category ? { EventToCategory: { some: { EventCategory: { id: category } } } } : {}),
        ...(gender ? { EventToGender: { some: { Gender: { id: gender } } } } : {})
      },
      include: {
        EventToModality: {
          include: {
            EventModality: true
          }
        },
        EventToCategory: {
          include: {
            EventCategory: true
          }
        },
        EventToGender: {
          include: {
            Gender: true
          }
        },
        EventPricingTier: true
      },
      orderBy: {
        startDate: isPast ? 'desc' : 'asc' // Eventos passados em ordem decrescente, futuros em ordem crescente
      }
    })

    console.log(`Eventos encontrados: ${events.length}`)
    console.log('Dados dos eventos:', JSON.stringify(events.map(e => ({ id: e.id, title: e.title, published: e.published })), null, 2))
    
    return NextResponse.json(events)
  } catch (error) {
    console.error('Erro ao buscar eventos:', error instanceof Error ? error.message : 'Erro desconhecido')
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateEventRequest
    console.log('Dados recebidos:', body)

    // Verificar se os dados de preço estão em body.EventPricingTier ou body.pricingTiers
    const isFree = body.isFree === true;
    const pricingTiers = isFree ? [] : (body.pricingTiers || []);
    const categoryPrices = body.pricing?.categoryPrices || [];
    const discountCoupons = body.pricing?.discountCoupons || [];
    console.log('Lotes de preço recebidos na API:', JSON.stringify(pricingTiers));
    console.log('Preços por categoria recebidos na API:', JSON.stringify(categoryPrices));
    console.log('Cupons de desconto recebidos na API:', JSON.stringify(discountCoupons));

    // Verificar se há lotes de preço válidos
    const hasValidPricingTiers = !body.isFree && Array.isArray(pricingTiers) && pricingTiers.length > 0;
    console.log('Tem lotes de preço válidos:', hasValidPricingTiers);
    console.log('Evento é gratuito:', body.isFree);
    console.log('pricingTiers é array:', Array.isArray(pricingTiers));
    console.log('Quantidade de lotes:', pricingTiers.length);

    // Validar as relações de modalidade-categoria-gênero
    if (body.modalityIds.length > 0 && body.genderIds.length > 0 && body.categoryIds.length > 0) {
      console.log('Validando relações modalidade-categoria-gênero');
      
      // Buscar todas as relações válidas para as modalidades e gêneros selecionados
      const validRelations = await prisma.$queryRaw`
        SELECT "categoryId" FROM "ModalityCategoryGender"
        WHERE "modalityId" IN (${Prisma.join(body.modalityIds)})
        AND "genderId" IN (${Prisma.join(body.genderIds)})
        AND "active" = true
      `;
      
      // Extrair os IDs de categoria válidos
      const validCategoryIds = new Set((validRelations as { categoryId: string }[]).map(rel => rel.categoryId));
      console.log('Categorias válidas encontradas:', Array.from(validCategoryIds));
      
      // Verificar se todas as categorias selecionadas são válidas
      const invalidCategories = body.categoryIds.filter(id => !validCategoryIds.has(id));
      
      if (invalidCategories.length > 0) {
        console.error('Categorias inválidas detectadas:', invalidCategories);
        return NextResponse.json({
          error: 'Algumas categorias selecionadas não são válidas para as combinações de modalidade e gênero escolhidas',
          invalidCategories
        }, { status: 400 });
      }
    }

    const eventId = uuidv4()
    const now = new Date()

    // Validar cityId, stateId e countryId antes de prosseguir
    if (body.cityId) {
      // Verificar se a cidade existe antes de tentar criar o evento
      const cityExists = await prisma.city.findUnique({
        where: { id: body.cityId }
      });
      
      if (!cityExists) {
        console.error(`Cidade com ID ${body.cityId} não encontrada no banco de dados`);
        // Se a cidade não existir, definir como undefined para evitar erros de tipagem
        body.cityId = undefined;
        body.stateId = undefined;
        body.countryId = undefined;
        
        console.log('IDs de localização definidos como undefined para evitar violação de constraint');
      }
    }

    try {
      // Usar uma transação para garantir que tudo seja criado ou nada seja criado
      const result = await prisma.$transaction(async (tx) => {
        // 1. Criar o evento
        const event = await tx.event.create({
          data: {
            id: eventId,
            title: body.title,
            description: body.description,
            slug: body.slug || '',
            location: body.location,
            locationUrl: body.locationUrl,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            registrationEnd: new Date(body.registrationEnd),
            status: body.status,
            published: body.published,
            isFree: body.isFree,
            addressDetails: body.addressDetails,
            zipCode: body.zipCode,
            latitude: body.latitude,
            longitude: body.longitude,
            // Usar os valores potencialmente corrigidos
            countryId: body.countryId,
            stateId: body.stateId,
            cityId: body.cityId,
            organizerId: session.user.id,
            createdAt: now,
            updatedAt: now,
            coverImage: body.coverImage,
            posterImage: body.posterImage,
            regulationPdf: body.regulationPdf,
            resultsFile: body.resultsFile,
            // Relações many-to-many
            EventToModality: {
              create: body.modalityIds.map(modalityId => ({
                id: uuidv4(),
                modalityId,
                createdAt: now
              }))
            },
            EventToCategory: {
              create: body.categoryIds.map(categoryId => ({
                id: uuidv4(),
                categoryId,
                createdAt: now
              }))
            },
            EventToGender: {
              create: body.genderIds.map(genderId => ({
                id: uuidv4(),
                genderId,
                createdAt: now
              }))
            }
          }
        });

        // 2. Criar os lotes de preço se o evento não for gratuito
        if (hasValidPricingTiers) {
          console.log('Criando lotes de preço na transação');
          for (const tier of pricingTiers) {
            console.log('Processando lote de preço:', JSON.stringify(tier));
            // Garantir id do tier vindo do front ou gerar novo
            const tierId = tier.id || uuidv4();
            // O preço já deve vir formatado corretamente do frontend como string com 2 casas decimais
            // Mas vamos garantir que seja assim
            let price = tier.price;
            
            // Verificar se o preço já é uma string formatada corretamente
            if (typeof price !== 'string' || !/^\d+\.\d{2}$/.test(price)) {
              console.log('Preço não está no formato correto, convertendo:', price);
              
              try {
                // Converter para número primeiro
                const numPrice = typeof price === 'string' 
                  ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) 
                  : Number(price);
                
                // Depois para string com 2 casas decimais
                price = numPrice.toFixed(2);
                console.log('Preço convertido para formato decimal:', price);
              } catch (error) {
                console.error('Erro ao converter preço:', error);
                price = "0.00";
              }
            }
            
            try {
              const pricingTier = await tx.eventPricingTier.create({
                data: {
                  id: tierId,
                  eventId: event.id,
                  name: tier.name,
                  description: tier.description || tier.name || null,
                  price: price,
                  startDate: tier.startDate ? new Date(tier.startDate) : new Date(),
                  endDate: tier.endDate ? new Date(tier.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  maxEntries: tier.maxEntries || 100,
                  active: tier.active ?? true,
                  createdAt: now,
                  updatedAt: now
                }
              });
              
              console.log('Lote de preço criado com sucesso:', pricingTier.id);
            } catch (error) {
              console.error('Erro ao criar lote de preço na transação:', error);
              throw error; // Propagar o erro para reverter a transação
            }
          }
        }
        
        // 3. Criar os preços por categoria (Avançado)
        if (categoryPrices.length > 0) {
          console.log('Criando preços por categoria na transação');
          for (const cp of categoryPrices) {
            // Garantir que o preço seja formatado como string decimal
            let price = cp.price;
            if (typeof price !== 'string' || !/^\d+\.\d{2}$/.test(price)) {
              try {
                const numPrice = typeof price === 'string'
                  ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
                  : Number(price);
                price = numPrice.toFixed(2);
              } catch (error) { price = "0.00"; }
            }

            // Validação para tierId obrigatório
            if (!cp.tierId) {
              throw new Error(`Tier (lote) é obrigatório para o preço da categoria ${cp.categoryId} / ${cp.genderId}`);
            }

            try {
              await tx.eventPricingByCategory.create({ // Corrigido: camelCase (Prisma Client)
                data: {
                  id: uuidv4(),
                  eventId: event.id,
                  modalityId: cp.modalityId,
                  categoryId: cp.categoryId,
                  genderId: cp.genderId,
                  price: price,
                  tierId: cp.tierId, // Corrigido: É obrigatório, remover '?? undefined'
                  createdAt: now,
                  updatedAt: now
                }
              });
            } catch (error) {
              console.error('Erro ao criar preço por categoria:', error);
              throw error;
            }
          }
        }

        // 4. Criar os cupons de desconto
        if (discountCoupons.length > 0) {
          console.log('Criando cupons de desconto na transação');
          for (const coupon of discountCoupons) {
            try {
              // Validação para datas obrigatórias
              if (!coupon.startDate) {
                throw new Error(`Data de início é obrigatória para o cupom ${coupon.code}`);
              }
              if (!coupon.endDate) {
                throw new Error(`Data de fim é obrigatória para o cupom ${coupon.code}`);
              }

              await tx.eventDiscountCoupon.create({ // Corrigido: camelCase (Prisma Client)
                data: {
                  id: uuidv4(),
                  eventId: event.id,
                  code: coupon.code,
                  discount: coupon.discount, // Já deve ser número
                  modalityId: coupon.modalityId || null,
                  categoryId: coupon.categoryId || null,
                  genderId: coupon.genderId || null,
                  maxUses: coupon.maxUses, // Já deve ser número
                  startDate: new Date(coupon.startDate), // Convertido para Date
                  endDate: new Date(coupon.endDate),     // Convertido para Date
                  createdAt: now,
                  updatedAt: now
                }
              });
            } catch (error) {
              console.error('Erro ao criar cupom de desconto:', error);
              throw error;
            }
          }
        }

        return event;
      });
      
      console.log('Evento criado com sucesso:', result);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao criar evento' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar evento:', error instanceof Error ? error.message : 'Erro desconhecido')
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
