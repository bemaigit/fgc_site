import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET /api/rankings/categories
export async function GET() {
  try {
    console.log('Iniciando busca de categorias de ranking')

    // Busca todas as categorias da tabela RankingCategory
    const categories = await prisma.rankingCategory.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        modalityId: true,
        active: true,
        description: true,
        RankingModality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata os dados para manter compatibilidade com a API anterior
    const formattedCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      modalityId: c.modalityId,
      modalityName: c.RankingModality.name,
      active: c.active,
      description: c.description
    }))

    console.log(`Categorias encontradas: ${categories.length}`)

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST /api/rankings/categories
export async function POST(request: Request) {
  try {
    console.log('Iniciando criação de categoria de ranking')
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Pega os dados do corpo da requisição
    const data = await request.json()
    console.log('Dados recebidos:', data)

    // Valida os dados
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }
    if (!data.modalityId) {
      return NextResponse.json(
        { error: 'Modalidade é obrigatória' },
        { status: 400 }
      )
    }

    // Verifica se a modalidade existe
    const existingModality = await prisma.rankingModality.findUnique({
      where: { id: data.modalityId }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se já existe uma categoria com o mesmo nome para esta modalidade
    const existingCategory = await prisma.rankingCategory.findFirst({
      where: { 
        name: data.name.trim(),
        modalityId: data.modalityId
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome para esta modalidade' },
        { status: 409 }
      )
    }

    // Cria a categoria na tabela RankingCategory
    const category = await prisma.rankingCategory.create({
      data: {
        id: uuidv4(),
        name: data.name.trim(),
        modalityId: data.modalityId,
        description: data.description || null,
        active: true,
        updatedAt: new Date()
      },
      include: {
        RankingModality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata a resposta para manter compatibilidade com a API anterior
    const formattedCategory = {
      id: category.id,
      name: category.name,
      modalityId: category.modalityId,
      modalityName: category.RankingModality.name,
      active: category.active,
      description: category.description
    }

    console.log('Categoria de ranking criada:', category.name)

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Erro ao criar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}

// DELETE /api/rankings/categories/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Iniciando exclusão de categoria de ranking: ${params.id}`)
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se existem rankings com esta categoria
    const rankingsWithCategory = await prisma.ranking.count({
      where: { 
        category: params.id
      }
    })

    if (rankingsWithCategory > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma categoria que está sendo usada em rankings' },
        { status: 400 }
      )
    }

    // Exclui a categoria
    await prisma.rankingCategory.delete({
      where: { id: params.id }
    })

    console.log('Categoria de ranking excluída:', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}
