import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar as 6 galerias mais recentes com pelo menos uma imagem
    const galleries = await prisma.galleryEvent.findMany({
      where: {
        GalleryImage: {
          some: {} // Precisa ter pelo menos uma imagem
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        _count: {
          select: {
            GalleryImage: true
          }
        },
        GalleryImage: {
          take: 1, // Pega apenas a primeira imagem como capa
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            thumbnail: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 6
    })

    // Processar as URLs das imagens para usar o endpoint de proxy
    const { processGalleryImageUrl } = await import('@/lib/processGalleryImageUrl')
    
    // Formatar os dados para o formato esperado pelo componente
    const formattedGalleries = galleries.map(gallery => {
      // Obter a URL original da thumbnail
      const originalThumbnail = gallery.GalleryImage[0]?.thumbnail || '';
      
      // Para facilitar o debug
      console.log(`[API] Processando thumbnail para galeria ${gallery.title}:`, {
        original: originalThumbnail
      });
      
      return {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        date: gallery.date.toISOString(),
        imageCount: gallery._count.GalleryImage,
        // Usar o caminho relativo para compatibilidade com o processamento no frontend
        coverImage: originalThumbnail || '/images/gallery-placeholder.jpg'
      }
    })

    return NextResponse.json({ galleries: formattedGalleries })
  } catch (error) {
    console.error('Erro ao buscar galerias recentes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar galerias recentes' },
      { status: 500 }
    )
  }
}
