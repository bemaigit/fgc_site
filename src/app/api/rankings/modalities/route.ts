import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET /api/rankings/modalities
export async function GET() {
  try {
    console.log('Iniciando busca de modalidades de ranking')
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Busca todas as modalidades da tabela RankingModality
    const modalities = await prisma.rankingModality.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        active: true,
        description: true
      }
    })

    console.log(`Modalidades encontradas: ${modalities.length}`)

    return NextResponse.json(modalities)
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades' },
      { status: 500 }
    )
  }
}

// POST /api/rankings/modalities
export async function POST(request: Request) {
  try {
    console.log('Iniciando criação de modalidade de ranking')
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Pega os dados do corpo da requisição
    const data = await request.json()

    // Valida os dados
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verifica se já existe uma modalidade com o mesmo nome
    const existingModality = await prisma.rankingModality.findFirst({
      where: { name: data.name.trim() }
    })

    if (existingModality) {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este nome' },
        { status: 409 }
      )
    }

    // Cria a modalidade na tabela RankingModality
    const modality = await prisma.rankingModality.create({
      data: {
        id: uuidv4(),
        name: data.name.trim(),
        description: data.description || null,
        active: true,
        updatedAt: new Date()
      }
    })

    console.log('Modalidade de ranking criada:', modality.name)

    return NextResponse.json(modality)
  } catch (error) {
    console.error('Erro ao criar modalidade:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao criar modalidade' },
      { status: 500 }
    )
  }
}

// DELETE /api/rankings/modalities/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Iniciando exclusão de modalidade de ranking: ${params.id}`)
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se existem rankings com esta modalidade
    const rankingsWithModality = await prisma.ranking.count({
      where: { modality: params.id }
    })

    if (rankingsWithModality > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma modalidade que está sendo usada em rankings' },
        { status: 400 }
      )
    }

    // Verifica se existem categorias associadas a esta modalidade
    const categoriesWithModality = await prisma.rankingCategory.count({
      where: { modalityId: params.id }
    })

    if (categoriesWithModality > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma modalidade que possui categorias associadas' },
        { status: 400 }
      )
    }

    // Exclui a modalidade
    await prisma.rankingModality.delete({
      where: { id: params.id }
    })

    console.log('Modalidade de ranking excluída:', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao excluir modalidade' },
      { status: 500 }
    )
  }
}
