import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Buscar notícia pelo slug sem formatação
    const news = await prisma.news.findFirst({
      where: {
        slug: slug
      },
      include: {
        User: {
          select: {
            name: true
          }
        },
        newsimage: true
      }
    })

    if (!news) {
      return new Response('Notícia não encontrada', { status: 404 })
    }

    // Buscar todas as imagens relacionadas a esta notícia diretamente
    const images = await prisma.newsimage.findMany({
      where: {
        news_id: news.id
      }
    })

    return NextResponse.json({
      news,
      rawImages: images,
      debug: {
        newsId: news.id,
        imagesCount: images.length,
        newsimageCount: news.newsimage.length
      }
    })
  } catch (error) {
    console.error('Erro ao buscar notícia para debug:', error)
    return new Response('Erro ao buscar notícia', { status: 500 })
  }
}
