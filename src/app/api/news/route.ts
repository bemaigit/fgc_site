import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Não autorizado', { status: 401 })
    }

    const body = await req.json()

    // Gera um slug baseado no título
    const slug = body.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return new Response('Usuário não encontrado', { status: 404 })
    }

    // Criar a notícia
    const news = await prisma.news.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title,
        content: body.content,
        excerpt: body.excerpt,
        slug,
        published: body.published,
        coverImage: body.coverImage,
        authorId: user.id,
        updatedAt: new Date(),
        publishedAt: body.published ? new Date() : null,
      }
    })

    // Criar as imagens associadas, se houver
    if (body.images && body.images.length > 0) {
      await Promise.all(
        body.images.map((image: { url: string, order: number }) => 
          prisma.newsimage.create({
            data: {
              id: crypto.randomUUID(),
              url: image.url,
              image_order: image.order || 0,
              news_id: news.id
            }
          })
        )
      )
    }

    // Buscar a notícia completa com as imagens
    const completeNews = await prisma.news.findUnique({
      where: { id: news.id },
      include: {
        User: {
          select: {
            name: true
          }
        },
        newsimage: true
      }
    })

    return NextResponse.json(completeNews)
  } catch (error) {
    console.error('Erro ao criar notícia:', error)
    return new Response('Erro ao criar notícia', { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const published = searchParams.get('published')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    
    // Calcular o skip para paginação
    const skip = (page - 1) * pageSize
    
    // Construir a query where
    const where: Prisma.NewsWhereInput = {}
    
    if (published === 'true') {
      where.published = true
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { content: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ]
    }
    
    // Buscar notícias com paginação
    const news = await prisma.news.findMany({
      where,
      include: {
        User: {
          select: {
            name: true
          }
        },
        newsimage: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    })
    
    // Contar o total de notícias para calcular o total de páginas
    const total = await prisma.news.count({ where })
    
    return NextResponse.json({
      data: news,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar notícias:', error)
    return new Response('Erro ao buscar notícias', { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new Response('Não autorizado', { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return new Response('ID da notícia não fornecido', { status: 400 })
    }
    
    // Excluir a notícia (as imagens serão excluídas automaticamente devido ao onDelete: Cascade)
    await prisma.news.delete({
      where: { id }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao excluir notícia:', error)
    return new Response('Erro ao excluir notícia', { status: 500 })
  }
}
