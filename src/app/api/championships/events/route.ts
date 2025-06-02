import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os eventos de campeonato
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

    // Obter parâmetros de consulta (se houver)
    const searchParams = req.nextUrl.searchParams
    const year = searchParams.get('year')
    const id = searchParams.get('id')
    
    // Construir filtro baseado em parâmetros de consulta
    const where: Record<string, any> = {}
    
    if (year) {
      where.year = parseInt(year)
    }
    
    if (id) {
      where.id = id
    }
    
    // Buscar eventos no banco de dados usando método do Prisma em vez de SQL raw
    const events = await prisma.championshipEvent.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(events)
  } catch (error) {
    console.error('Erro ao buscar eventos de campeonato:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar eventos de campeonato' },
      { status: 500 }
    )
  }
}

// POST - Criar um novo evento de campeonato
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
    if (!data.name || !data.year) {
      return NextResponse.json(
        { error: 'Nome e ano são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se já existe um evento com o mesmo nome para o mesmo ano
    const existingEvent = await prisma.championshipEvent.findFirst({
      where: {
        name: data.name,
        year: parseInt(data.year)
      }
    })
    
    if (existingEvent) {
      return NextResponse.json(
        { error: 'Já existe um evento com este nome para este ano' },
        { status: 409 }
      )
    }
    
    // Inserir evento no banco de dados usando método do Prisma em vez de SQL raw
    const newEvent = await prisma.championshipEvent.create({
      data: {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        year: parseInt(data.year),
        description: data.description || null
      },
    });

    return NextResponse.json({ message: 'Evento criado com sucesso', id: newEvent.id })
  } catch (error) {
    console.error('Erro ao criar evento de campeonato:', error)
    return NextResponse.json(
      { error: 'Erro ao criar evento de campeonato' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar um evento de campeonato existente
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
    if (!data.id || !data.name || !data.year) {
      return NextResponse.json(
        { error: 'ID, nome e ano são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se o evento existe
    const existingEvent = await prisma.championshipEvent.findUnique({
      where: { id: data.id }
    })
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se já existe outro evento com o mesmo nome para o mesmo ano
    const duplicateCheck = await prisma.championshipEvent.findFirst({
      where: {
        name: data.name,
        year: parseInt(data.year),
        id: { not: data.id } // Excluir o próprio evento da verificação
      }
    })
    
    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'Já existe outro evento com este nome para este ano' },
        { status: 409 }
      )
    }
    
    // Atualizar evento no banco de dados usando método do Prisma em vez de SQL raw
    const updatedEvent = await prisma.championshipEvent.update({
      where: { id: data.id },
      data: {
        name: data.name,
        year: parseInt(data.year),
        description: data.description || undefined
      }
    });

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Erro ao atualizar evento de campeonato:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar evento de campeonato' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir um evento de campeonato
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
    
    // Obter ID do evento da URL
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se o evento existe
    const existingEvent = await prisma.championshipEvent.findUnique({
      where: { id }
    })
    
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se há campeões vinculados a este evento
    const championCount = await prisma.championEntry.count({
      where: { eventId: id }
    })
    
    if (championCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir o evento porque existem campeões vinculados a ele' },
        { status: 409 }
      )
    }
    
    // Excluir evento do banco de dados usando método do Prisma em vez de SQL raw
    await prisma.championshipEvent.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Evento excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir evento de campeonato:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir evento de campeonato' },
      { status: 500 }
    )
  }
}
