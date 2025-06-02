import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Função para mapear IDs de modalidades para nomes legíveis
const getReadableModalityName = (id: string): string => {
  // Mapeamento de IDs conhecidos para nomes legíveis
  const idToName: Record<string, string> = {
    '00ef4e35-0e03-4387-ac8b-2e70a0ecef49': 'MTB',
    '402e9e9d-3fd1-49c9-b6f4-12413801fb14': 'ROAD',
    'b12a1f42-8530-4a25-ab1f-f3a4661e4929': 'SPEED',
    'bcddde3d-45d3-4a6c-a098-df953056e0d1': 'BMX'
  };
  
  // Se o ID estiver no mapeamento, retorna o nome legível; caso contrário, retorna o próprio ID
  return idToName[id] || id;
};

// GET /api/athletes
export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    
    // Filtros da consulta
    const searchTerm = searchParams.get('search')
    let categoryFilter = searchParams.get('category')
    let modalityFilter = searchParams.get('modality')
    const genderFilter = searchParams.get('gender')
    const userIdFilter = searchParams.get('userId') // Adicionar filtro por userId
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit
    
    // Mapear valores de texto para IDs UUID
    // Mapeamento para modalidades
    if (modalityFilter) {
      const modalityMap: Record<string, string> = {
        'MTB': 'cm7roc93s0002kja8p293o507',      // Mountain Bike
        'ROAD': 'cm7ro2ao80001kja8o4jdj323',     // Ciclismo de Estrada
        'BMX': 'cm7rod87g0003kja83a2xjgwv'       // BMX Racing
      }
      modalityFilter = modalityMap[modalityFilter] || modalityFilter
    }
    
    // Mapeamento para categorias
    if (categoryFilter) {
      const categoryMap: Record<string, string> = {
        'ELITE': 'cm7roxtzq0011kja8s7xxmq2n',       
        'JUNIOR': '3524e809-1524-4219-81dd-5a6459aa1894',
        'SUB-23': '4e681273-544f-46ef-8105-9c33c3fac95e',
        'Master A': 'e9fb334c-f044-4cd0-818f-0a82f698c0ad'
      }
      categoryFilter = categoryMap[categoryFilter] || categoryFilter
    }
    
    console.log('[DEBUG] Filtros mapeados:', { modalityFilter, categoryFilter, genderFilter })
    console.log('Iniciando busca de atletas com filtros:', { 
      page, searchTerm, categoryFilter, modalityFilter, genderFilter 
    })
    
    // Construir o filtro com base nos parâmetros
    const where: any = {}
    
    if (searchTerm) {
      where.fullName = {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }
    
    // Filtrar por userId se fornecido
    if (userIdFilter) {
      where.userId = userIdFilter
    }
    
    // Inicializar where.AthleteProfile para evitar sobrescrita
    where.AthleteProfile = {}
    
    if (categoryFilter) {
      where.AthleteProfile.categoryId = categoryFilter
    }
    
    if (modalityFilter) {
      where.AthleteProfile.modalityId = modalityFilter
    }
    
    // Filtrar por gênero através da tabela AthleteProfile
    if (genderFilter && genderFilter !== 'ALL') {
      where.AthleteProfile.genderId = genderFilter
    }
    
    // Se nenhum filtro de profile foi aplicado, remover a condição vazia
    if (Object.keys(where.AthleteProfile).length === 0) {
      delete where.AthleteProfile
    }

    // Busca atletas e seus usuários vinculados com filtros e paginação
    const athletes = await prisma.athlete.findMany({
      take: limit,
      skip: offset,
      where,
      include: {
        User_Athlete_userIdToUser: {
          select: {
            image: true
          }
        },
        AthleteProfile: {
          include: {
            EventCategory: true,  // Inclui os dados da categoria
            EventModality: true  // Inclui os dados da modalidade
          }
        },
        AthleteGallery: {
          orderBy: [
            { featured: 'desc' },
            { order: 'asc' }
          ],
          take: 5
        },
        Club: {
          select: {
            clubName: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    // Conta o total de atletas que correspondem ao filtro
    const totalCount = await prisma.athlete.count({ where })
    
    console.log(`Atletas encontrados: ${athletes.length}, Total: ${totalCount}`)
    
    // Formatar os dados para o componente cliente
    const formattedAthletes = athletes.map(athlete => {
      // Determinar imagem de perfil (prioridade: foto de usuário, galeria destacada, ou null)
      const profileImage = 
        athlete.User_Athlete_userIdToUser?.image ||
        athlete.AthleteGallery?.find((img: any) => img.featured)?.imageUrl || 
        athlete.AthleteGallery?.[0]?.imageUrl || 
        null;

      // Obter a modalidade a partir do perfil do atleta OU usar a modalidade legada
      const modalityName = athlete.AthleteProfile?.EventModality?.name || 
                          (athlete.modalities?.length > 0 ? getReadableModalityName(athlete.modalities[0]) : 'Não informada');
                      
      // Obter a categoria a partir do perfil do atleta OU usar a categoria legada
      const categoryName = athlete.AthleteProfile?.EventCategory?.name || athlete.category || 'Não informada';

      // Log para debug
      console.log('Formatando atleta:', {
        id: athlete.id,
        nome: athlete.fullName,
        categoria_perfil: athlete.AthleteProfile?.EventCategory?.name,
        categoria_legada: athlete.category,
        categoria_final: categoryName,
        modalidade_perfil: athlete.AthleteProfile?.EventModality?.name,
        modalidade_legada: athlete.modalities?.[0] ? getReadableModalityName(athlete.modalities[0]) : null,
        modalidade_final: modalityName
      });

      return {
        id: athlete.id,
        fullName: athlete.fullName,
        category: categoryName,
        club: athlete.Club?.clubName || "Independente",
        profileImage,
        birthDate: athlete.birthDate.toISOString(),
        hasBiography: athlete.AthleteProfile?.biography ? true : false,
        hasGallery: athlete.AthleteGallery?.length > 0,
        modalities: athlete.modalities.map((modalityId: string) => ({
          id: modalityId,
          name: getReadableModalityName(modalityId)
        })),
        // Adicionamos a modalidade principal como uma string para facilitar a exibição no card
        modalityName
      };
    });
    
    const totalPages = Math.ceil(totalCount / limit)
    
    // Retornar os dados formatados para o cliente
    return NextResponse.json({
      athletes: formattedAthletes,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages
      }
    })
  } catch (error) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Erro desconhecido' }

    console.error('Erro detalhado ao buscar atletas:', errorObj)
    
    return NextResponse.json(
      { error: 'Erro ao buscar atletas', details: errorObj },
      { status: 500 }
    )
  }
}

// POST /api/athletes
export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    
    // Cria o atleta
    const athlete = await prisma.athlete.create({
      data
    })

    return NextResponse.json(athlete)
  } catch (error) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Erro desconhecido' }

    console.error('Erro detalhado ao criar atleta:', errorObj)
    
    return NextResponse.json(
      { error: 'Erro ao criar atleta', details: errorObj },
      { status: 500 }
    )
  }
}
