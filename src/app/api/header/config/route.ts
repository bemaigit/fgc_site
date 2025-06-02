import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verifica se o usuário é super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Atualiza a configuração do header
    const updatedConfig = await prisma.headerConfig.update({
      where: { id: 'default-header' },
      data: {
        ...data,
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Erro ao atualizar configurações do header:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
