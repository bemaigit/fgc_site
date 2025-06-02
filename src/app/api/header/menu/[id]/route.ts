import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/config'
import { prisma } from '@/lib/prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN']

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      console.error('Erro de autenticação:', { session })
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      )
    }

    // Verifica se o usuário tem permissão
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem editar itens de menu.' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Atualiza o item do menu
    const updatedMenuItem = await prisma.headerMenu.update({
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
      { error: 'Erro ao atualizar item do menu. Tente novamente.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      console.error('Erro de autenticação:', { session })
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      )
    }

    // Verifica se o usuário tem permissão
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem excluir itens de menu.' },
        { status: 403 }
      )
    }

    // Deleta o item do menu
    await prisma.headerMenu.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir item do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir item do menu. Tente novamente.' },
      { status: 500 }
    )
  }
}
