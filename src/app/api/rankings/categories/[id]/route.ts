import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/rankings/categories/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Buscando categoria de ranking: ${params.id}`)

    const category = await prisma.rankingCategory.findUnique({
      where: { id: params.id },
      include: {
        modality: {
          select: {
            name: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Formata a resposta para manter compatibilidade com a API anterior
    const formattedCategory = {
      id: category.id,
      name: category.name,
      modalityId: category.modalityId,
      modalityName: category.modality.name,
      active: category.active,
      description: category.description
    }

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Erro ao buscar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar categoria' },
      { status: 500 }
    )
  }
}

// PUT /api/rankings/categories/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Iniciando atualização de categoria de ranking: ${params.id}`)
    
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

    // Verifica se a categoria existe
    const existingCategory = await prisma.rankingCategory.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se já existe outra categoria com o mesmo nome para esta modalidade
    const duplicateCategory = await prisma.rankingCategory.findFirst({
      where: { 
        name: data.name.trim(),
        modalityId: existingCategory.modalityId,
        id: { not: params.id }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome para esta modalidade' },
        { status: 409 }
      )
    }

    // Atualiza a categoria
    const updatedCategory = await prisma.rankingCategory.update({
      where: { id: params.id },
      data: {
        name: data.name.trim(),
        description: data.description,
        active: data.active !== undefined ? data.active : existingCategory.active,
        updatedAt: new Date()
      },
      include: {
        modality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata a resposta para manter compatibilidade com a API anterior
    const formattedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      modalityId: updatedCategory.modalityId,
      modalityName: updatedCategory.modality.name,
      active: updatedCategory.active,
      description: updatedCategory.description
    }

    console.log('Categoria de ranking atualizada:', updatedCategory.name)

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
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
