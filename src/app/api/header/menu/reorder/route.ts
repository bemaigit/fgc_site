import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN']

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number()
    })
  )
})

export async function PUT(request: Request) {
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
        { error: 'Acesso negado. Apenas administradores podem reordenar itens de menu.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { items } = reorderSchema.parse(body)

    // Usamos uma transação para garantir que todas as atualizações são realizadas
    await prisma.$transaction(
      items.map(item => 
        prisma.headerMenu.update({
          where: { id: item.id },
          data: { 
            order: item.order,
            updatedBy: session.user.id
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao reordenar itens do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao reordenar itens do menu. Tente novamente.' },
      { status: 500 }
    )
  }
}
