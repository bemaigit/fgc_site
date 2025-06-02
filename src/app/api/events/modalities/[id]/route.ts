import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para validação
const modalitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean().default(true)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`Buscando modalidade com ID ${id}`)

    const modality = await prisma.eventModality.findUnique({
      where: { id }
    })

    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(modality)
  } catch (error) {
    console.error(`Erro ao buscar modalidade: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar modalidade'
    return NextResponse.json(
      { error: errorMessage },
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

    const { id } = params
    console.log(`Atualizando modalidade com ID ${id}`)

    // Verifica se a modalidade existe
    const existingModality = await prisma.eventModality.findUnique({
      where: { id }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Valida dados
    const data = await request.json()
    const validationResult = modalitySchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { name, description, active } = validationResult.data

    try {
      // Atualiza a modalidade
      const updatedModality = await prisma.eventModality.update({
        where: { id },
        data: {
          name,
          description,
          active,
          updatedBy: session.user.id,
          updatedAt: new Date()
        }
      })

      console.log('Modalidade atualizada com sucesso')
      return NextResponse.json(updatedModality)
    } catch (error: any) {
      // Verifica se o erro é de nome único
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe uma modalidade com este nome' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error(`Erro ao atualizar modalidade: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar modalidade'
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
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const id = params.id
    console.log(`Excluindo modalidade com ID ${id}`)

    // Verifica se a modalidade existe
    const existingModality = await prisma.eventModality.findUnique({
      where: { id }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se existem categorias associadas a esta modalidade
    const categoriesCount = await prisma.eventCategory.count({
      where: { modalityId: id }
    })

    if (categoriesCount > 0) {
      return NextResponse.json(
        { 
          error: 'Esta modalidade tem categorias associadas e não pode ser excluída. Remova as categorias primeiro.',
          count: categoriesCount 
        },
        { status: 400 }
      )
    }
    
    // Verificar se existem relações ModalityCategoryGender associadas
    const mcgRelationsCount = await (prisma as any).ModalityCategoryGender.count({
      where: { modalityId: id }
    })
    
    if (mcgRelationsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Esta modalidade tem relações com categorias e gêneros. Remova essas relações primeiro.',
          count: mcgRelationsCount 
        },
        { status: 400 }
      )
    }

    // Verificar se existem eventos associados a esta modalidade
    const directEventsCount = await prisma.event.count({
      where: { modalityId: id }
    })

    const eventToModalityCount = await prisma.eventToModality.count({
      where: { modalityId: id }
    })

    const totalEventsCount = directEventsCount + eventToModalityCount

    if (totalEventsCount > 0) {
      return NextResponse.json(
        { 
          error: 'Esta modalidade está sendo usada em eventos',
          count: totalEventsCount
        },
        { status: 400 }
      )
    }

    // Exclui a modalidade
    await prisma.eventModality.delete({
      where: { id }
    })

    console.log('Modalidade excluída com sucesso')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Erro ao excluir modalidade: ${error}`)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir modalidade'
    
    // Verificar se é um erro do Prisma relacionado a registro não encontrado
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
