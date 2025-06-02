import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os campeões
export async function GET(req: NextRequest) {
  try {
    // Parâmetros de consulta
    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const modalityId = searchParams.get('modalityId')
    const categoryId = searchParams.get('categoryId')
    const gender = searchParams.get('gender')
    const year = searchParams.get('year')
    
    // Construir o objeto where para a consulta Prisma
    const where: {
      eventId?: string | { in: string[] };
      modalityId?: string;
      categoryId?: string;
      gender?: string | { in: string[] };
    } = {}
    
    if (eventId) {
      where.eventId = eventId
    } else if (year) {
      // Se não tiver eventId mas tiver o ano, buscar eventos pelo ano
      const events = await prisma.championshipEvent.findMany({
        where: { year: parseInt(year) },
        select: { id: true }
      })
      
      if (events.length > 0) {
        where.eventId = {
          in: events.map(event => event.id)
        }
      } else {
        // Se não encontrar eventos para o ano, retornar array vazio
        return NextResponse.json([])
      }
    }
    
    if (modalityId) {
      where.modalityId = modalityId
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (gender) {
      // Aceitar tanto 'MALE' quanto 'Masculino'
      if (gender.toUpperCase() === 'MALE') {
        where.gender = { in: ['MALE', 'Masculino'] }
      } 
      // Aceitar tanto 'FEMALE' quanto 'FEMININO' e 'Feminino'
      else if (gender.toUpperCase() === 'FEMALE') {
        where.gender = { in: ['FEMALE', 'FEMININO', 'Feminino'] }
      }
      else {
        where.gender = gender
      }
    }

    console.log('Busca com os filtros:', where)
    
    // Buscar campeões com Prisma
    const champions = await prisma.championEntry.findMany({
      where,
      include: {
        Athlete: {
          include: {
            User_Athlete_userIdToUser: {
              select: {
                image: true
              }
            }
          }
        },
        ChampionCategory: true,
        ChampionModality: true,
        ChampionshipEvent: true,
      },
    })
    
    console.log('Campeões encontrados:', JSON.stringify(champions, null, 2))
    
    // Formatar os dados para o frontend
    const formattedChampions = champions.map(champion => ({
      id: champion.id,
      athleteId: champion.athleteId,
      modalityId: champion.modalityId,
      categoryId: champion.categoryId,
      eventId: champion.eventId,
      position: champion.position,
      city: champion.city,
      team: champion.team,
      gender: champion.gender,
      createdAt: champion.createdAt,
      // Dados relacionados simplificados
      athlete: {
        id: champion.Athlete.id,
        fullName: champion.Athlete.fullName,
        image: champion.Athlete.User_Athlete_userIdToUser?.image || null
      },
      modalityName: champion.ChampionModality?.name || 'Sem modalidade',
      categoryName: champion.ChampionCategory?.name || 'Sem categoria',
      year: champion.ChampionshipEvent?.year || new Date().getFullYear(),
      // Objetos relacionados completos para CampeoesTable.tsx
      Athlete: champion.Athlete,
      ChampionModality: champion.ChampionModality,
      ChampionCategory: champion.ChampionCategory,
      ChampionshipEvent: champion.ChampionshipEvent
    }))
    
    return NextResponse.json(formattedChampions)
  } catch (error) {
    console.error('Erro ao listar campeões:', error)
    return NextResponse.json(
      { error: 'Erro ao listar campeões' },
      { status: 500 }
    )
  }
}

// POST - Criar novo registro de campeão
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const data = await req.json()
    
    // Validar dados obrigatórios
    if (!data.athleteId || !data.eventId || !data.categoryId || !data.modalityId) {
      return NextResponse.json(
        { error: 'Atleta, evento, modalidade e categoria são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se já existe um registro de campeão com as mesmas informações
    const existingEntry = await prisma.championEntry.findFirst({
      where: {
        athleteId: data.athleteId,
        eventId: data.eventId,
        categoryId: data.categoryId,
        modalityId: data.modalityId
      }
    })
    
    if (existingEntry) {
      return NextResponse.json(
        { error: 'Este atleta já está registrado como campeão nesta categoria e evento' },
        { status: 409 }
      )
    }
    
    // Criar o registro de campeão no modelo championEntry
    const champion = await prisma.championEntry.create({
      data: {
        id: data.id || crypto.randomUUID(),
        athleteId: data.athleteId,
        eventId: data.eventId,
        categoryId: data.categoryId,
        modalityId: data.modalityId,
        position: data.position || 1,
        gender: data.gender || 'MALE',
        city: data.city || '',
        team: data.team || null
      },
      include: {
        Athlete: {
          include: {
            User_Athlete_userIdToUser: {
              select: {
                image: true
              }
            }
          }
        },
        ChampionCategory: true,
        ChampionModality: true,
        ChampionshipEvent: true
      }
    })

    return NextResponse.json(champion)
  } catch (error) {
    console.error('Erro ao criar registro de campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar registro de campeão' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar um registro de campeão existente
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const data = await req.json()
    
    // Validar dados obrigatórios
    if (!data.id || !data.athleteId || !data.eventId || !data.categoryId || !data.modalityId) {
      return NextResponse.json(
        { error: 'ID, atleta, evento, modalidade e categoria são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se o registro existe
    const existingEntry = await prisma.championEntry.findUnique({
      where: { id: data.id }
    })
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Registro de campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Atualizar o registro de campeão no championEntry
    const updatedChampion = await prisma.championEntry.update({
      where: { id: data.id },
      data: {
        athleteId: data.athleteId,
        eventId: data.eventId,
        categoryId: data.categoryId,
        modalityId: data.modalityId,
        position: data.position || 1,
        gender: data.gender || existingEntry.gender,
        city: data.city || existingEntry.city,
        team: data.team || existingEntry.team
      },
      include: {
        Athlete: {
          include: {
            User_Athlete_userIdToUser: {
              select: {
                image: true
              }
            }
          }
        },
        ChampionCategory: true,
        ChampionModality: true,
        ChampionshipEvent: true
      }
    })

    return NextResponse.json(updatedChampion)
  } catch (error) {
    console.error('Erro ao atualizar registro de campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar registro de campeão' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir um registro de campeão
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter ID da URL
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se o registro existe
    const existingEntry = await prisma.championEntry.findUnique({
      where: { id }
    })
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Registro de campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Excluir o registro
    await prisma.championEntry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir registro de campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir registro de campeão' },
      { status: 500 }
    )
  }
}
