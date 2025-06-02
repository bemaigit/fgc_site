import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Pegar o último item para definir a ordem
    const lastItem = await prisma.footerMenu.findFirst({
      orderBy: {
        order: 'desc'
      }
    })

    const newOrder = lastItem ? lastItem.order + 1 : 0

    const newMenuItem = await prisma.footerMenu.create({
      data: {
        ...data,
        order: newOrder,
        footerId: 'default-footer',
        createdBy: session.user.id
      }
    })

    return NextResponse.json(newMenuItem)
  } catch (error) {
    console.error('Erro ao criar item do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao criar item do menu' },
      { status: 500 }
    )
  }
}
