import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    console.log('Buscando notícia com slug:', slug)

    // Buscar notícia pelo slug
    const news = await prisma.news.findFirst({
      where: {
        slug: slug,
        published: true
      },
      include: {
        User: {
          select: {
            name: true
          }
        },
        newsimage: {
          orderBy: {
            image_order: 'asc'
          }
        }
      }
    })

    if (!news) {
      console.log('Notícia não encontrada com slug:', slug)
      return new Response('Notícia não encontrada', { status: 404 })
    }

    console.log('Notícia encontrada:', news.id, news.title)
    console.log('Imagens encontradas:', news.newsimage.length)

    // Verificar se existem imagens e fazer log delas
    if (news.newsimage && news.newsimage.length > 0) {
      console.log('Primeira imagem:', JSON.stringify(news.newsimage[0]))
    }

    // Mapear os campos do newsimage para o formato esperado pelo frontend
    const formattedNews = {
      ...news,
      newsimage: news.newsimage.map(image => ({
        id: image.id,
        url: image.url,
        alt: image.alt || '',
        order: image.image_order
      }))
    }

    return NextResponse.json(formattedNews)
  } catch (error) {
    console.error('Erro ao buscar notícia:', error)
    return new Response('Erro ao buscar notícia', { status: 500 })
  }
}
