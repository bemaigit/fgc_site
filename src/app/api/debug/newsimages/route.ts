import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar todas as imagens de notícias
    const newsImages = await prisma.newsimage.findMany({
      take: 50,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Buscar notícias com imagens
    const newsWithImages = await prisma.news.findMany({
      where: {
        newsimage: {
          some: {}
        }
      },
      include: {
        newsimage: true
      },
      take: 10
    })

    return NextResponse.json({
      totalNewsImages: newsImages.length,
      newsImages: newsImages,
      newsWithImages: newsWithImages.map(news => ({
        id: news.id,
        title: news.title,
        slug: news.slug,
        imageCount: news.newsimage.length,
        images: news.newsimage
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar imagens de notícias:', error)
    return new Response('Erro ao buscar imagens de notícias', { status: 500 })
  }
}
