import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para validação
const categorySchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  modalityIds: z.array(z.string()).min(1, 'Selecione pelo menos uma modalidade'),
  active: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log(`Buscando categoria com ID ${id}`)

    // Buscar a categoria
    const category = await (prisma as any).EventCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Buscar as modalidades relacionadas
    const modalityRelations = await (prisma as any).EventModalityToCategory.findMany({
      where: { categoryId: id },
      select: { modalityId: true }
    })

    // Adicionar as modalidades à resposta
    const modalityIds = modalityRelations.map((relation: any) => relation.modalityId)
    
    return NextResponse.json({
      ...category,
      modalityIds
    })
  } catch (error) {
    console.error(`Erro ao buscar categoria: ${error}`)
    return NextResponse.json(
      { error: 'Erro ao buscar categoria' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida dados
    const data = await request.json()
    const validationResult = categorySchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { id, name, description, modalityIds, active } = validationResult.data

    // Verifica se o ID na URL corresponde ao ID no corpo
    if (params.id !== id) {
      return NextResponse.json(
        { error: 'ID na URL não corresponde ao ID no corpo da requisição' },
        { status: 400 }
      )
    }

    // Verifica se a categoria existe
    const existingCategory = await (prisma as any).EventCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se as modalidades existem
    const modalitiesCount = await (prisma as any).EventModality.count({
      where: {
        id: {
          in: modalityIds
        }
      }
    })

    if (modalitiesCount !== modalityIds.length) {
      return NextResponse.json(
        { error: 'Uma ou mais modalidades não foram encontradas' },
        { status: 400 }
      )
    }

    console.log('Atualizando categoria:', { id, name, description, modalityIds, active })

    // Atualiza a categoria e suas relações com modalidades
    const now = new Date()
    
    // Usar uma transação para garantir a consistência dos dados
    const category = await prisma.$transaction(async (tx) => {
      // 1. Atualizar a categoria
      const updatedCategory = await (tx as any).EventCategory.update({
        where: { id },
        data: {
          name,
          description,
          active: active ?? true,
          updatedBy: session.user.id,
          updatedAt: now
        }
      })
      
      // 2. Remover todas as relações existentes
      await (tx as any).EventModalityToCategory.deleteMany({
        where: { categoryId: id }
      })
      
      // 3. Criar novas relações para cada modalidade
      for (const modalityId of modalityIds) {
        await (tx as any).EventModalityToCategory.create({
          data: {
            modalityId,
            categoryId: id,
            updatedAt: now,
            createdBy: session.user.id,
            updatedBy: session.user.id
          }
        })
      }
      
      return updatedCategory
    })

    console.log('Categoria atualizada com sucesso:', category.id)
    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar categoria'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const id = params.id

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Excluindo categoria:', id)

    // Verifica se existem eventos usando esta categoria
    const eventsUsingCategory = await (prisma as any).Event.count({
      where: { categoryId: id }
    })

    if (eventsUsingCategory > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir esta categoria pois existem eventos vinculados a ela' },
        { status: 400 }
      )
    }
    
    // Verifica se existem relações ModalityCategoryGender usando esta categoria
    const mcgRelationsCount = await (prisma as any).ModalityCategoryGender.count({
      where: { categoryId: id }
    })
    
    if (mcgRelationsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Esta categoria tem relações com modalidades e gêneros. Remova essas relações primeiro.',
          count: mcgRelationsCount 
        },
        { status: 400 }
      )
    }

    // Usar uma transação para garantir a consistência dos dados
    await prisma.$transaction(async (tx) => {
      // 1. Excluir todas as relações com modalidades
      await (tx as any).EventModalityToCategory.deleteMany({
        where: { categoryId: id }
      })
      
      // 2. Excluir a categoria
      await (tx as any).EventCategory.delete({
        where: { id }
      })
    })

    console.log('Categoria excluída com sucesso')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir categoria'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
