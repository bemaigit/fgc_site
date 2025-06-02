import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { storageService } from '@/lib/storage'

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar a imagem e verificar se pertence à galeria correta
    const image = await prisma.galleryImage.findFirst({
      where: {
        id: params.id,
        GalleryEvent: {
          slug: params.slug
        }
      },
      select: {
        id: true,
        filename: true,
        eventId: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Excluir o arquivo do storage
    const imagePath = `galeria-de-imagens/${image.eventId}/${image.filename}`
    const thumbnailPath = `galeria-de-imagens/${image.eventId}/${image.filename.replace('.jpg', '-thumb.jpg')}`

    try {
      await Promise.all([
        storageService.delete(imagePath),
        storageService.delete(thumbnailPath)
      ])
    } catch (storageError) {
      console.error('Erro ao excluir arquivos do storage:', storageError)
      // Continua mesmo com erro no storage para garantir exclusão do banco
    }

    // Excluir registro da imagem do banco de dados
    await prisma.galleryImage.delete({
      where: {
        id: image.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir imagem:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir imagem' },
      { status: 500 }
    )
  }
}
