import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todas as categorias
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta (se houver)
    const searchParams = req.nextUrl.searchParams
    const modalityId = searchParams.get('modalityId')
    
    // Usamos Prisma.query normal em vez de $queryRaw
    let categories;
    
    if (modalityId) {
      categories = await prisma.ChampionCategory.findMany({
        where: {
          modalityId: modalityId
        },
        include: {
          ChampionModality: true
        },
        orderBy: [
          { ChampionModality: { name: 'asc' } },
          { name: 'asc' }
        ]
      });
    } else {
      categories = await prisma.ChampionCategory.findMany({
        include: {
          ChampionModality: true
        },
        orderBy: [
          { ChampionModality: { name: 'asc' } },
          { name: 'asc' }
        ]
      });
    }
    
    // Formatar o resultado para incluir o nome da modalidade
    const formattedCategories = categories.map((category: {
      id: string;
      name: string;
      modalityId: string;
      description: string | null;
      ChampionModality: { name: string };
    }) => ({
      ...category,
      modalityName: category.ChampionModality.name
    }));

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST - Criar uma nova categoria
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const data = await req.json()
    
    // Validar os dados recebidos
    if (!data.name || !data.modalityId) {
      return NextResponse.json(
        { error: 'Nome e ID da modalidade são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se a modalidade existe
    const existingModality = await prisma.ChampionModality.findUnique({
      where: { id: data.modalityId }
    })
    
    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se já existe uma categoria com o mesmo nome para a mesma modalidade
    const existingCategory = await prisma.ChampionCategory.findFirst({
      where: {
        name: data.name,
        modalityId: data.modalityId
      }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome para esta modalidade' },
        { status: 409 }
      )
    }
    
    // Criar a categoria
    const category = await prisma.ChampionCategory.create({
      data: {
        id: data.id || crypto.randomUUID(),
        name: data.name,
        modalityId: data.modalityId,
        description: data.description || null
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

// PUT - Atualizar uma categoria existente
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter dados do corpo da requisição
    const data = await req.json()
    
    // Validar os dados recebidos
    if (!data.id || !data.name || !data.modalityId) {
      return NextResponse.json(
        { error: 'ID, nome e ID da modalidade são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se a categoria existe
    const existingCategory = await prisma.ChampionCategory.findUnique({
      where: { id: data.id }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se já existe outra categoria com o mesmo nome para a mesma modalidade
    const duplicateCheck = await prisma.ChampionCategory.findFirst({
      where: {
        name: data.name,
        modalityId: data.modalityId,
        id: { not: data.id } // Excluir a própria categoria da verificação
      }
    })
    
    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'Já existe outra categoria com este nome para esta modalidade' },
        { status: 409 }
      )
    }
    
    // Atualizar a categoria
    const updatedCategory = await prisma.ChampionCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        modalityId: data.modalityId,
        description: data.description || undefined
      }
    })
    
    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir uma categoria
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter ID da categoria da URL
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se a categoria existe
    const existingCategory = await prisma.ChampionCategory.findUnique({
      where: { id }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se há campeões vinculados a esta categoria
    const championCount = await prisma.ChampionEntry.count({
      where: { categoryId: id }
    })
    
    if (championCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir a categoria porque existem campeões vinculados a ela' },
        { status: 409 }
      )
    }
    
    // Excluir a categoria
    await prisma.ChampionCategory.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    )
  }
}
