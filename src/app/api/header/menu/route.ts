import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/config'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN']

export async function POST(request: Request) {
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
        { error: 'Acesso negado. Apenas administradores podem criar itens de menu.' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Obtém o maior order atual
    const maxOrder = await prisma.headerMenu.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    // Prepara os dados para criar o item de menu
    const menuItemData = {
      id: uuidv4(), // Gera um ID único
      label: data.label,
      url: data.url,
      requireAuth: data.requireAuth ?? false,
      roles: data.roles ?? [],
      isActive: data.isActive ?? true,
      order: (maxOrder?.order ?? -1) + 1,
      headerId: 'default-header',
      createdBy: session.user.id,
      updatedAt: new Date() // Necessário pois é um campo obrigatório
    }

    // Cria novo item de menu
    const newMenuItem = await prisma.headerMenu.create({
      data: menuItemData
    })

    if (!newMenuItem) {
      throw new Error('Erro ao criar item do menu')
    }

    return NextResponse.json(newMenuItem)
  } catch (error) {
    console.error('Erro ao criar item do menu:', error)
    return NextResponse.json(
      { error: 'Erro ao criar item do menu. Tente novamente.' },
      { status: 500 }
    )
  }
}

interface MenuItem {
  id: string;
  order: number;
}

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

    const { items } = await request.json()

    // Atualiza a ordem dos itens em uma transação
    await prisma.$transaction(
      items.map((item: MenuItem, index: number) =>
        prisma.headerMenu.update({
          where: { id: item.id },
          data: { 
            order: index,
            updatedAt: new Date() // Necessário pois é um campo obrigatório
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
