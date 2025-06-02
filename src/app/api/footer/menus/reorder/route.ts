import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { handler as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para reordenação
const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0)
  }))
})

// POST - Reordenar menus
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    // Atualizar a ordem de cada item
    const updates = items.map(item => 
      prisma.footerMenu.update({
        where: { id: item.id },
        data: { 
          order: item.order,
          updatedBy: session.user.id
        }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao reordenar menus:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao reordenar menus' },
      { status: 500 }
    )
  }
}
