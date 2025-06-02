import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Schema de validação para menu item
const menuItemSchema = z.object({
  label: z.string().min(1, 'O texto do menu é obrigatório'),
  url: z.string().min(1, 'A URL é obrigatória'),
  requireAuth: z.boolean().default(false),
  roles: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

// GET - Listar todos os menus do footer
export async function GET() {
  try {
    const menus = await prisma.footerMenu.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Erro ao buscar menus:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar menus' },
      { status: 500 }
    )
  }
}

// POST - Criar novo menu item
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
    const validatedData = menuItemSchema.parse(body)

    // Encontrar a maior ordem atual
    const lastMenu = await prisma.footerMenu.findFirst({
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastMenu?.order ?? -1) + 1

    const newMenu = await prisma.footerMenu.create({
      data: {
        id: uuidv4(),
        label: validatedData.label,
        url: validatedData.url,
        requireAuth: validatedData.requireAuth,
        roles: validatedData.roles,
        isActive: validatedData.isActive,
        order: nextOrder,
        footerId: 'default-footer',
        createdBy: session.user.id,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(newMenu)
  } catch (error) {
    console.error('Erro ao criar menu:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar menu' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar menu item
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, ...data } = body
    const validatedData = menuItemSchema.parse(data)

    const updatedMenu = await prisma.footerMenu.update({
      where: { id },
      data: {
        label: validatedData.label,
        url: validatedData.url,
        requireAuth: validatedData.requireAuth,
        roles: validatedData.roles,
        isActive: validatedData.isActive,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(updatedMenu)
  } catch (error) {
    console.error('Erro ao atualizar menu:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar menu' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir menu item
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id } = body

    await prisma.footerMenu.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir menu:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir menu' },
      { status: 500 }
    )
  }
}
