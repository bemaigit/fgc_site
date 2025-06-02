import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/athlete-profiles
// Lista todos os atletas com seus perfis estendidos para exibição pública
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de paginação e filtro
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    
    // Calcula o offset para paginação
    const skip = (page - 1) * limit
    
    // Constrói o filtro com base nos parâmetros
    const filter: any = {
      active: true,
    }
    
    // Adiciona filtro de busca por nome
    if (search) {
      filter.fullName = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    // Adiciona filtro por categoria
    if (category) {
      filter.category = category
    }
    
    // Busca os atletas com seus perfis
    const athletes = await prisma.athlete.findMany({
      where: filter,
      include: {
        AthleteProfile: true,
        AthleteGallery: {
          where: { featured: true },
          orderBy: { order: 'asc' },
          take: 1
        },
        User_Athlete_userIdToUser: {
          select: {
            image: true
          }
        },
        Club: {
          select: {
            clubName: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      },
      skip,
      take: limit
    })
    
    // Conta o total de atletas que correspondem ao filtro
    const total = await prisma.athlete.count({
      where: filter
    })
    
    // Formata os dados para a resposta
    const formattedAthletes = athletes.map(athlete => {
      // Seleciona a primeira imagem da galeria ou usa a imagem do perfil do usuário
      const profileImage = 
        athlete.AthleteGallery.length > 0 ? 
        athlete.AthleteGallery[0].imageUrl : 
        athlete.User_Athlete_userIdToUser?.image || null
      
      return {
        id: athlete.id,
        fullName: athlete.fullName,
        category: athlete.category,
        club: athlete.Club?.clubName || 'Independente',
        birthDate: athlete.birthDate,
        profileImage,
        biography: athlete.AthleteProfile?.biography || null,
        hasBiography: !!athlete.AthleteProfile?.biography,
        hasGallery: athlete.AthleteGallery.length > 0
      }
    })
    
    return NextResponse.json({
      athletes: formattedAthletes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar perfis de atletas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfis de atletas' },
      { status: 500 }
    )
  }
}
