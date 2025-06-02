import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/config'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const updatedMenuItem = await prisma.footerMenu.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(updatedMenuItem)
  } catch (error) {
    console.error('Erro ao atualizar item do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar item do menu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    await prisma.footerMenu.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Item do menu excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir item do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir item do menu' },
      { status: 500 }
    )
  }
}
