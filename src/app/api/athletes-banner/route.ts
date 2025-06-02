import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AthletesSectionBanner } from './types'
import crypto from 'crypto'

// GET /api/athletes-banner - Obter todos os banners da seção de atletas
export async function GET(request: NextRequest) {
  try {
    // Usar SQL nativo em vez do modelo Prisma que ainda não está no client
    const banners = await prisma.$queryRawUnsafe<AthletesSectionBanner[]>(
      `SELECT * FROM "AthletesSectionBanner" ORDER BY "order" ASC`
    )
    
    return NextResponse.json(banners)
  } catch (error) {
    console.error('Erro ao buscar banners:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar banners' },
      { status: 500 }
    )
  }
}

// POST /api/athletes-banner - Criar um novo banner
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário é admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Validar dados
    if (!data.title || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Título e imagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar o banner usando SQL nativo
    const banner = await prisma.$queryRawUnsafe<AthletesSectionBanner[]>(
      `INSERT INTO "AthletesSectionBanner" (
        "id", "title", "subtitle", "description", "imageUrl", "ctaText", 
        "active", "order", "createdBy", "updatedBy", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *`,
      crypto.randomUUID(),
      data.title,
      data.subtitle || null,
      data.description || null,
      data.imageUrl,
      data.ctaText || 'Conheça nossos Atletas',
      data.active !== undefined ? data.active : true,
      data.order || 0,
      session.user.id,
      session.user.id
    )

    // Processar o resultado para garantir um JSON válido
    // O resultado do $queryRawUnsafe é um array, mas queremos retornar o primeiro item
    const createdBanner = Array.isArray(banner) && banner.length > 0 ? banner[0] : banner;
    
    return NextResponse.json({ success: true, data: createdBanner }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar banner:', error)
    return NextResponse.json(
      { error: 'Erro ao criar banner' },
      { status: 500 }
    )
  }
}

// PUT /api/athletes-banner - Atualizar um banner existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário é admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Validar dados
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID do banner é obrigatório' },
        { status: 400 }
      )
    }

    if (!data.title || !data.imageUrl) {
      return NextResponse.json(
        { error: 'Título e imagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar o banner com SQL nativo
    const banner = await prisma.$queryRawUnsafe<AthletesSectionBanner[]>(
      `UPDATE "AthletesSectionBanner" SET 
        "title" = $1, "subtitle" = $2, "description" = $3, "imageUrl" = $4, 
        "ctaText" = $5, "active" = $6, "order" = $7, "updatedBy" = $8, "updatedAt" = NOW()
      WHERE "id" = $9
      RETURNING *`,
      data.title,
      data.subtitle || null,
      data.description || null,
      data.imageUrl,
      data.ctaText || 'Conheça nossos Atletas',
      data.active !== undefined ? data.active : true,
      data.order !== undefined ? data.order : 0,
      session.user.id,
      data.id
    )

    // Processar o resultado para garantir um JSON válido
    const updatedBanner = Array.isArray(banner) && banner.length > 0 ? banner[0] : banner;
    
    return NextResponse.json({ success: true, data: updatedBanner })
  } catch (error) {
    console.error('Erro ao atualizar banner:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar banner' },
      { status: 500 }
    )
  }
}

// DELETE /api/athletes-banner - Excluir um banner
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário é admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    // Obter o ID do banner
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do banner é obrigatório' },
        { status: 400 }
      )
    }

    // Excluir o banner com SQL nativo
    await prisma.$executeRawUnsafe(
      `DELETE FROM "AthletesSectionBanner" WHERE "id" = $1`,
      id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir banner:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir banner' },
      { status: 500 }
    )
  }
}
