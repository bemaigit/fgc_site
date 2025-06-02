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
    const { name, description, modalityId, active } = data

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!modalityId) {
      return NextResponse.json(
        { error: 'Modalidade é obrigatória' },
        { status: 400 }
      )
    }

    const category = await prisma.eventCategory.update({
      where: { id },
      data: {
        name,
        description,
        modalityId,
        active,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
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

    // Verificar se existem eventos usando esta categoria
    const eventsUsingCategory = await prisma.event.findFirst({
      where: { categoryId: id }
    })

    if (eventsUsingCategory) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma categoria que está sendo usada em eventos' },
        { status: 400 }
      )
    }

    await prisma.eventCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}
