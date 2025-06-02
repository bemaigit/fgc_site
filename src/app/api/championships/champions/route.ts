import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para validação de dados de campeão
const championSchema = z.object({
  id: z.string().optional(),
  athleteId: z.string().min(1, 'ID do atleta é obrigatório'),
  modalityId: z.string().min(1, 'ID da modalidade é obrigatório'),
  categoryId: z.string().min(1, 'ID da categoria é obrigatório'),
  gender: z.string().min(1, 'Gênero é obrigatório'),
  position: z.number().int().min(1, 'Posição deve ser um número positivo'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  team: z.string().optional().nullable(),
  eventId: z.string().min(1, 'ID do evento é obrigatório'),
})

// GET - Listar campeões de um evento
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar campeões do evento
    const champions = await prisma.championEntry.findMany({
      where: {
        eventId: eventId
      },
      include: {
        Athlete: true,
        ChampionModality: true,
        ChampionCategory: true
      },
      orderBy: [
        { ChampionModality: { name: 'asc' } },
        { ChampionCategory: { name: 'asc' } },
        { gender: 'asc' },
        { position: 'asc' }
      ]
    })

    return NextResponse.json(champions)
  } catch (error) {
    console.error('Erro ao buscar campeões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar campeões' },
      { status: 500 }
    )
  }
}

// POST - Adicionar um novo campeão
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
    
    // Validar os dados recebidos
    const validationResult = championSchema.safeParse(data)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    // Verificar se o evento existe
    const event = await prisma.championshipEvent.findUnique({
      where: { id: data.eventId }
    })
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se o atleta existe
    const athlete = await prisma.athlete.findUnique({
      where: { id: data.athleteId }
    })
    
    if (!athlete) {
      return NextResponse.json(
        { error: 'Atleta não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se a modalidade existe
    const modality = await prisma.championModality.findUnique({
      where: { id: data.modalityId }
    })
    
    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se a categoria existe
    const category = await prisma.championCategory.findUnique({
      where: { id: data.categoryId }
    })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se já existe um campeão com a mesma combinação
    const existingChampion = await prisma.championEntry.findFirst({
      where: {
        eventId: data.eventId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        gender: data.gender,
        position: data.position
      }
    })
    
    if (existingChampion) {
      return NextResponse.json(
        { error: 'Já existe um campeão com esta posição para esta combinação de modalidade, categoria e gênero' },
        { status: 409 }
      )
    }
    
    // Criar entrada de campeão
    const champion = await prisma.championEntry.create({
      data: {
        id: data.id || crypto.randomUUID(),
        athleteId: data.athleteId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        gender: data.gender,
        position: data.position,
        city: data.city,
        team: data.team,
        eventId: data.eventId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        Athlete: true,
        ChampionModality: true,
        ChampionCategory: true
      }
    })

    return NextResponse.json(champion, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar campeão' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar um campeão existente
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
    
    // Validar os dados recebidos
    const validationResult = championSchema.safeParse(data)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID do campeão é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se o campeão existe
    const existingChampion = await prisma.championEntry.findUnique({
      where: { id: data.id }
    })
    
    if (!existingChampion) {
      return NextResponse.json(
        { error: 'Campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se há outro campeão com a mesma combinação
    const duplicateCheck = await prisma.championEntry.findFirst({
      where: {
        eventId: data.eventId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        gender: data.gender,
        position: data.position,
        id: { not: data.id }
      }
    })
    
    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'Já existe outro campeão com esta posição para esta combinação de modalidade, categoria e gênero' },
        { status: 409 }
      )
    }
    
    // Atualizar entrada de campeão
    const champion = await prisma.championEntry.update({
      where: { id: data.id },
      data: {
        athleteId: data.athleteId,
        modalityId: data.modalityId,
        categoryId: data.categoryId,
        gender: data.gender,
        position: data.position,
        city: data.city,
        team: data.team,
        updatedAt: new Date()
      },
      include: {
        Athlete: true,
        ChampionModality: true,
        ChampionCategory: true
      }
    })

    return NextResponse.json(champion)
  } catch (error) {
    console.error('Erro ao atualizar campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar campeão' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir um campeão
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
    
    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do campeão é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se o campeão existe
    const champion = await prisma.championEntry.findUnique({
      where: { id }
    })
    
    if (!champion) {
      return NextResponse.json(
        { error: 'Campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Excluir o campeão
    await prisma.championEntry.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Campeão excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir campeão:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir campeão' },
      { status: 500 }
    )
  }
}
