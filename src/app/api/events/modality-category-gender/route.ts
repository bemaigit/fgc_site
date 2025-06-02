import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

// Schema para validação
const relationSchema = z.object({
  modalityId: z.string().min(1, 'Modalidade é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  genderId: z.string().min(1, 'Gênero é obrigatório'),
  active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('Sessão autenticada:', session.user?.email)
    
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get('modalityId')
    const genderId = searchParams.get('genderId')
    const activeOnly = searchParams.get('active') === 'true'
    
    console.log('Buscando relações modalidade-categoria-gênero:', { modalityId, genderId, activeOnly })
    
    // Verificar se o modelo existe no Prisma Client
    console.log('Modelos disponíveis no Prisma:', Object.keys(prisma).filter(key => !key.startsWith('$')))
    
    // Busca relações com filtros opcionais usando acesso dinâmico para contornar problemas de tipagem
    const relations = await (prisma as any).ModalityCategoryGender.findMany({
      where: {
        ...(modalityId ? { modalityId } : {}),
        ...(genderId ? { genderId } : {}),
        ...(activeOnly ? { active: true } : {})
      },
      include: {
        EventModality: true,
        EventCategory: true,
        Gender: true
      },
      orderBy: [
        { EventModality: { name: 'asc' } },
        { EventCategory: { name: 'asc' } },
        { Gender: { name: 'asc' } }
      ]
    })

    console.log(`${relations.length} relações encontradas`)
    return NextResponse.json(relations)
  } catch (error) {
    console.error('Erro ao buscar relações:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação e permissões
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida dados
    const data = await request.json()
    const validationResult = relationSchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { modalityId, categoryId, genderId, active } = validationResult.data

    console.log('Criando nova relação:', { modalityId, categoryId, genderId, active })

    // Verifica se as entidades existem
    const [modality, category, gender] = await Promise.all([
      prisma.eventModality.findUnique({ where: { id: modalityId } }),
      prisma.eventCategory.findUnique({ where: { id: categoryId } }),
      prisma.gender.findUnique({ where: { id: genderId } })
    ])

    if (!modality) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 400 })
    }
    
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 400 })
    }
    
    if (!gender) {
      return NextResponse.json({ error: 'Gênero não encontrado' }, { status: 400 })
    }

    // Verifica se já existe uma relação com esses IDs
    const existingRelation = await (prisma as any).ModalityCategoryGender.findUnique({
      where: {
        modalityId_categoryId_genderId: {
          modalityId,
          categoryId,
          genderId
        }
      }
    })

    if (existingRelation) {
      return NextResponse.json({ error: 'Relação já existe' }, { status: 400 })
    }

    // Cria a relação
    const relation = await (prisma as any).ModalityCategoryGender.create({
      data: {
        id: randomUUID(),
        modalityId,
        categoryId,
        genderId,
        active: active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.user?.email || null,
        updatedBy: session.user?.email || null
      },
      include: {
        EventModality: true,
        EventCategory: true,
        Gender: true
      }
    })

    console.log('Relação criada:', relation)
    return NextResponse.json(relation, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar relação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticação e permissões
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida dados
    const data = await request.json()
    const { id, active } = data

    if (!id) {
      return NextResponse.json(
        { error: 'ID da relação é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Atualizando relação:', { id, active })

    // Verifica se a relação existe
    const existingRelation = await (prisma as any).ModalityCategoryGender.findUnique({
      where: { id }
    })

    if (!existingRelation) {
      return NextResponse.json({ error: 'Relação não encontrada' }, { status: 404 })
    }

    // Atualiza a relação
    const relation = await (prisma as any).ModalityCategoryGender.update({
      where: { id },
      data: {
        active: active ?? existingRelation.active,
        updatedAt: new Date(),
        updatedBy: session.user?.email || null
      },
      include: {
        EventModality: true,
        EventCategory: true,
        Gender: true
      }
    })

    console.log('Relação atualizada:', relation)
    return NextResponse.json(relation)
  } catch (error) {
    console.error('Erro ao atualizar relação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticação e permissões
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Obtém ID da relação
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da relação é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Excluindo relação:', id)

    // Verifica se a relação existe
    const existingRelation = await (prisma as any).ModalityCategoryGender.findUnique({
      where: { id }
    })

    if (!existingRelation) {
      return NextResponse.json({ error: 'Relação não encontrada' }, { status: 404 })
    }

    // Exclui a relação
    await (prisma as any).ModalityCategoryGender.delete({
      where: { id }
    })

    console.log('Relação excluída com sucesso')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir relação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
