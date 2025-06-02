import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const modalities = await prisma.eventModality.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(modalities)
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { name, description, active } = data

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const modality = await prisma.eventModality.create({
      data: {
        name,
        description,
        active: active ?? true,
        createdBy: session.user.id,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(modality)
  } catch (error) {
    console.error('Erro ao criar modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao criar modalidade' },
      { status: 500 }
    )
  }
}
