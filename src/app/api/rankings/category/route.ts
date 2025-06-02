import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET /api/rankings/category
export async function GET() {
  try {
    console.log('Iniciando busca de categorias de ranking')

    // Busca todas as categorias da tabela RankingCategory
    const categories = await prisma.rankingCategory.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        modalityId: true,
        active: true,
        description: true,
        RankingModality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata os dados para manter compatibilidade com a API anterior
    const formattedCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      modalityId: c.modalityId,
      modalityName: c.RankingModality.name,
      active: c.active,
      description: c.description
    }))

    console.log(`Categorias encontradas: ${categories.length}`)

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

// POST /api/rankings/category
export async function POST(request: Request) {
  try {
    console.log('Iniciando criação de categoria de ranking')
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      console.log('Usuário sem permissão:', session.user.role)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Pega os dados do corpo da requisição
    const data = await request.json()
    console.log('Dados recebidos para criação de categoria:', data)

    // Valida os dados
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }
    if (!data.modalityId) {
      return NextResponse.json(
        { error: 'Modalidade é obrigatória' },
        { status: 400 }
      )
    }

    // Verifica se a modalidade existe
    let modalityId = data.modalityId;
    
    // Verifica se modalityId é um UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(modalityId)) {
      // Se não for UUID, busca a modalidade pelo nome
      console.log(`Buscando modalidade pelo nome: ${modalityId}`);
      const modalityByName = await prisma.rankingModality.findFirst({
        where: { name: modalityId }
      });
      
      if (modalityByName) {
        console.log(`Encontrada modalidade com ID: ${modalityByName.id}`);
        modalityId = modalityByName.id;
      } else {
        return NextResponse.json(
          { error: 'Modalidade não encontrada' },
          { status: 404 }
        );
      }
    }
    
    // Agora usamos o modalityId resolvido (seja o original ou o que encontramos pelo nome)
    const existingModality = await prisma.rankingModality.findUnique({
      where: { id: modalityId }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se já existe uma categoria com o mesmo nome para esta modalidade
    const existingCategory = await prisma.rankingCategory.findFirst({
      where: { 
        name: data.name.trim(),
        modalityId: modalityId
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome para esta modalidade' },
        { status: 409 }
      )
    }

    // Cria a categoria na tabela RankingCategory
    const category = await prisma.rankingCategory.create({
      data: {
        id: uuidv4(),
        name: data.name.trim(),
        modalityId: modalityId,
        description: data.description || null,
        active: true,
        updatedAt: new Date()
      },
      include: {
        RankingModality: {
          select: {
            name: true
          }
        }
      }
    })

    // Formata a resposta para manter compatibilidade com a API anterior
    const formattedCategory = {
      id: category.id,
      name: category.name,
      modalityId: category.modalityId,
      modalityName: category.RankingModality.name,
      active: category.active,
      description: category.description
    }

    console.log('Categoria de ranking criada:', category.name)

    return NextResponse.json(formattedCategory)
  } catch (error) {
    console.error('Erro ao criar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}
