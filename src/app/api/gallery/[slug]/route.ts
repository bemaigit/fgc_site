import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { storageService as storage } from '@/lib/storage'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Extrair o slug dos parâmetros de forma segura
    const { slug } = params;
    
    console.log(`[API] Buscando galeria com slug: ${slug}`);
    
    const gallery = await prisma.galleryEvent.findUnique({
      where: { slug },
      include: {
        GalleryImage: true,
        _count: {
          select: { GalleryImage: true }
        }
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Erro ao buscar galeria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar a galeria para pegar os arquivos
    const gallery = await prisma.galleryEvent.findUnique({
      where: { slug: params.slug },
      include: {
        GalleryImage: true
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria não encontrada' },
        { status: 404 }
      )
    }

    // Excluir os arquivos do storage
    await Promise.all(gallery.GalleryImage.map(async (image) => {
      const path = `galeria-de-imagens/${gallery.id}/${image.filename}`
      await storage.deleteFile(path)

      const thumbnailPath = `galeria-de-imagens/${gallery.id}/${image.filename.replace('.jpg', '-thumb.jpg')}`
      await storage.deleteFile(thumbnailPath)
    }))

    // Excluir a galeria (as imagens serão excluídas em cascata)
    await prisma.galleryEvent.delete({
      where: { id: gallery.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir galeria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
