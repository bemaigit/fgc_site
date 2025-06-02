import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/rankings/category/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica se o ID da categoria foi fornecido
    const categoryId = await params.id
    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID da categoria não fornecido' },
        { status: 400 }
      )
    }

    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Pega os dados do corpo da requisição
    const data = await request.json()
    console.log(`Atualizando categoria ${categoryId}:`, data)

    // Valida os dados
    if (data.name && !data.name.trim()) {
      return NextResponse.json(
        { error: 'Nome não pode ser vazio' },
        { status: 400 }
      )
    }

    // Prepara os dados para atualização
    const updateData: any = {}
    if (data.name) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.active !== undefined) updateData.active = data.active
    if (data.modalityId) updateData.modalityId = data.modalityId
    updateData.updatedAt = new Date()

    // Verifica se a categoria existe
    const existingCategory = await prisma.rankingCategory.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se já existe outra categoria com o mesmo nome para esta modalidade
    if (data.name) {
      const duplicateCategory = await prisma.rankingCategory.findFirst({
        where: {
          name: data.name.trim(),
          modalityId: data.modalityId || existingCategory.modalityId,
          id: { not: categoryId } // Exclui a própria categoria da verificação
        }
      })

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome para esta modalidade' },
          { status: 409 }
        )
      }
    }

    // Atualiza a categoria
    const updatedCategory = await prisma.rankingCategory.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        RankingModality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata a resposta
    const formattedCategory = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      modalityId: updatedCategory.modalityId,
      modalityName: updatedCategory.RankingModality.name,
      active: updatedCategory.active,
      description: updatedCategory.description
    }

    console.log('Categoria atualizada:', updatedCategory.name)

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    )
  }
}

// DELETE /api/rankings/category/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica se o ID da categoria foi fornecido
    const categoryId = await params.id
    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID da categoria não fornecido' },
        { status: 400 }
      )
    }

    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verifica se a categoria existe
    const existingCategory = await prisma.rankingCategory.findUnique({
      where: { id: categoryId }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se existem configurações de ranking usando esta categoria
    const existingConfigurations = await prisma.rankingConfiguration.findFirst({
      where: { categoryId }
    })

    if (existingConfigurations) {
      // Opção 1: Negar a exclusão
      // return NextResponse.json(
      //   { error: 'Não é possível excluir esta categoria porque ela está sendo usada em configurações de ranking' },
      //   { status: 400 }
      // )

      // Opção 2: Desativar em vez de excluir
      const updatedCategory = await prisma.rankingCategory.update({
        where: { id: categoryId },
        data: { 
          active: false,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Categoria desativada com sucesso',
        id: updatedCategory.id
      })
    }

    // Exclui a categoria se não estiver sendo usada
    await prisma.rankingCategory.delete({
      where: { id: categoryId }
    })

    console.log('Categoria excluída:', categoryId)

    return NextResponse.json({
      message: 'Categoria excluída com sucesso',
      id: categoryId
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}
