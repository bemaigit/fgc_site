import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const categories = await prisma.eventCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        eventsRelation: true
      }
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { name, description, modalityId } = data

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

    const category = await prisma.eventCategory.create({
      data: {
        name,
        description,
        modalityId,
        createdBy: session.user.id,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}
