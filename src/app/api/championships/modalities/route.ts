import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todas as modalidades
export async function GET() {
  try {
    // Para listagem, não precisamos necessariamente verificar se é admin
    
    // Buscar modalidades no banco de dados usando método do Prisma em vez de SQL raw
    const modalities = await prisma.championModality.findMany({
      orderBy: {
        name: 'asc'
      }
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

// POST - Criar uma nova modalidade
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const data = await req.json()

    // Validar dados
    if (!data.name || !data.id) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma modalidade com o mesmo nome
    const existingModality = await prisma.championModality.findFirst({
      where: {
        name: data.name
      }
    })

    if (existingModality) {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este nome' },
        { status: 409 }
      )
    }

    // Inserir modalidade no banco de dados
    const modality = await prisma.championModality.create({
      data: {
        id: data.id,
        name: data.name,
        description: data.description || null
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

// PUT - Atualizar uma modalidade existente
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter dados do corpo da requisição
    const data = await req.json()

    // Validar dados
    if (!data.id || !data.name) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verificar se a modalidade existe
    const existingModality = await prisma.championModality.findFirst({
      where: {
        id: data.id
      }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o novo nome já existe em outra modalidade
    const duplicateName = await prisma.championModality.findFirst({
      where: {
        name: data.name,
        id: {
          not: data.id
        }
      }
    })

    if (duplicateName) {
      return NextResponse.json(
        { error: 'Já existe outra modalidade com este nome' },
        { status: 400 }
      )
    }

    // Atualizar modalidade no banco de dados
    const modality = await prisma.championModality.update({
      where: {
        id: data.id
      },
      data: {
        name: data.name,
        description: data.description || null
      }
    })

    return NextResponse.json(modality)
  } catch (error) {
    console.error('Erro ao atualizar modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar modalidade' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir uma modalidade
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter ID da modalidade a ser excluída
    const id = req.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da modalidade não fornecido' },
        { status: 400 }
      )
    }

    // Verificar se há categorias associadas a esta modalidade
    const categoryCount = await prisma.championCategory.count({
      where: {
        modalityId: id
      }
    })
    
    if (categoryCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir esta modalidade pois existem categorias associadas a ela' },
        { status: 400 }
      )
    }

    // Verificar se há campeões associados a esta modalidade
    const championCount = await prisma.championEntry.count({
      where: {
        modalityId: id
      }
    })
    
    if (championCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir esta modalidade pois existem campeões associados a ela' },
        { status: 400 }
      )
    }

    // Excluir modalidade do banco de dados
    await prisma.championModality.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: 'Modalidade excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir modalidade' },
      { status: 500 }
    )
  }
}
