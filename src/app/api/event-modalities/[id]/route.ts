import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params
    const data = await request.json()
    const { name, description, active } = data

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const modality = await prisma.eventModality.update({
      where: { id },
      data: {
        name,
        description,
        active,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(modality)
  } catch (error) {
    console.error('Erro ao atualizar modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar modalidade' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params

    // Verificar se existem categorias usando esta modalidade
    const categoriesUsingModality = await prisma.eventCategory.findFirst({
      where: { modalityId: id }
    })

    if (categoriesUsingModality) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma modalidade que está sendo usada em categorias' },
        { status: 400 }
      )
    }

    await prisma.eventModality.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir modalidade' },
      { status: 500 }
    )
  }
}
