import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// Schema para validação
const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  modalityIds: z.array(z.string()).min(1, 'Selecione pelo menos uma modalidade'),
  active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('Buscando categorias...')
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get('modalityId')

    if (modalityId) {
      // Busca categorias associadas a uma modalidade específica
      const categoriesWithModality = await (prisma as any).EventModalityToCategory.findMany({
        where: { modalityId },
        include: {
          EventCategory: true
        },
        orderBy: {
          EventCategory: {
            name: 'asc'
          }
        }
      })
      
      // Extrair apenas as categorias dos resultados
      const categories = categoriesWithModality.map((relation: any) => relation.EventCategory)
      console.log(`${categories.length} categorias encontradas para a modalidade ${modalityId}`)
      return NextResponse.json(categories)
    } else {
      // Busca todas as categorias com suas modalidades relacionadas
      const categories = await (prisma as any).EventCategory.findMany({
        orderBy: {
          name: 'asc'
        }
      })

      // Buscar as relações entre categorias e modalidades
      const categoryIds = categories.map((category: any) => category.id)
      const modalityRelations = await (prisma as any).EventModalityToCategory.findMany({
        where: {
          categoryId: {
            in: categoryIds
          }
        }
      })

      // Agrupar as modalidades por categoria
      const modalitiesByCategory: Record<string, string[]> = {}
      modalityRelations.forEach((relation: any) => {
        if (!modalitiesByCategory[relation.categoryId]) {
          modalitiesByCategory[relation.categoryId] = []
        }
        modalitiesByCategory[relation.categoryId].push(relation.modalityId)
      })

      // Adicionar as modalidades às categorias
      const extendedCategories = categories.map((category: any) => ({
        ...category,
        modalityIds: modalitiesByCategory[category.id] || []
      }))

      console.log(`${extendedCategories.length} categorias encontradas`)
      return NextResponse.json(extendedCategories)
    }
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { name, description, modalityIds, active } = validationResult.data

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

    // Verifica se já existe uma categoria com o mesmo nome
    const existingCategory = await (prisma as any).EventCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      )
    }

    console.log('Criando nova categoria:', { name, description, modalityIds, active })

    // Cria a categoria e suas relações com modalidades
    const now = new Date()
    const categoryId = randomUUID()
    
    // Usar uma transação para garantir a consistência dos dados
    const category = await prisma.$transaction(async (tx) => {
      // 1. Criar a categoria
      const newCategory = await (tx as any).EventCategory.create({
        data: {
          id: categoryId,
          name,
          description,
          active: active ?? true,
          createdBy: session.user.id,
          updatedBy: session.user.id,
          updatedAt: now
        }
      })
      
      // 2. Criar relações para cada modalidade
      for (const modalityId of modalityIds) {
        await (tx as any).EventModalityToCategory.create({
          data: {
            modalityId,
            categoryId,
            updatedAt: now,
            createdBy: session.user.id,
            updatedBy: session.user.id
          }
        })
      }
      
      return newCategory
    })

    console.log('Categoria criada com sucesso:', category.id)
    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar categoria'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { id, name, description, modalityIds, active } = data

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
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
      
      // 2. Excluir relações antigas
      await (tx as any).EventModalityToCategory.deleteMany({
        where: { categoryId: id }
      })
      
      // 3. Criar novas relações
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

export async function DELETE(request: NextRequest) {
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

    // Obtém o ID da categoria a ser excluída
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Excluindo categoria:', id)

    // Verifica se a categoria existe
    const category = await (prisma as any).EventCategory.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

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
