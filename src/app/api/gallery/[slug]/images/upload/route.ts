import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { storageService as storage } from '@/lib/storage'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(
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

    // Encontrar a galeria pelo slug
    const gallery = await prisma.galleryEvent.findUnique({
      where: { slug: params.slug }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria não encontrada' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Verificar tipo do arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido' },
        { status: 400 }
      )
    }

    // Obter a categoria das imagens (se fornecida)
    const category = formData.get('category') as string || 'default'

    // Sanitizar o nome da categoria para uso em URLs/caminhos
    const sanitizedCategory = category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Converter o arquivo para buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Processar imagem original
    const processedImage = await sharp(buffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Gerar thumbnail
    const thumbnail = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover'
      })
      .jpeg({ quality: 70 })
      .toBuffer()

    // Criar caminho hierárquico para armazenamento
    const storagePath = `galeria-de-imagens/${gallery.id}/${sanitizedCategory}`

    // Gerar nome de arquivo único
    const fileId = randomUUID()
    const extension = 'jpg'
    const filename = `${fileId}.${extension}`
    const thumbnailFilename = `${fileId}-thumb.${extension}`

    // Configurar o storage service para usar o prefixo correto
    storage.setPrefix('')

    console.log('Realizando upload da imagem original:', {
      path: `${storagePath}/${filename}`,
      size: processedImage.length
    })

    // Upload da imagem original com tratamento de erro
    try {
      await storage.uploadFile(processedImage, {
        filename: `${storagePath}/${filename}`,
        contentType: 'image/jpeg',
        size: processedImage.length
      })
    } catch (error: any) {
      console.error('Erro no upload da imagem original:', error)
      throw new Error(`Falha no upload da imagem original: ${error?.message || 'Erro desconhecido'}`)
    }

    console.log('Realizando upload da thumbnail:', {
      path: `${storagePath}/${thumbnailFilename}`,
      size: thumbnail.length
    })

    // Upload da thumbnail com tratamento de erro
    try {
      await storage.uploadFile(thumbnail, {
        filename: `${storagePath}/${thumbnailFilename}`,
        contentType: 'image/jpeg',
        size: thumbnail.length
      })
    } catch (error: any) {
      console.error('Erro no upload da thumbnail:', error)
      throw new Error(`Falha no upload da thumbnail: ${error?.message || 'Erro desconhecido'}`)
    }

    // Preparar os caminhos para armazenamento no banco de dados
    // Usamos caminhos relativos em vez de URLs absolutas para melhor compatibilidade entre ambientes
    const relativePath = `${storagePath}/${filename}`
    const relativeThumbPath = `${storagePath}/${thumbnailFilename}`
    
    // Gerar URLs para proxy de imagens
    const proxyUrl = `/api/gallery/image?path=${encodeURIComponent(relativePath)}`
    const proxyThumbUrl = `/api/gallery/image?path=${encodeURIComponent(relativeThumbPath)}`
    
    console.log('Salvando referências no banco de dados:', {
      id: fileId,
      filename,
      proxyUrl,
      proxyThumbUrl,
      relativePath
    })
    
    // Salvar referência no banco com o caminho hierárquico
    const image = await prisma.galleryImage.create({
      data: {
        id: fileId,
        filename: filename,
        url: proxyUrl,                 // URL do proxy em vez da URL direta do MinIO
        thumbnail: proxyThumbUrl,      // URL do proxy em vez da URL direta do MinIO
        size: processedImage.length,
        eventId: gallery.id,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('Erro no upload da imagem:', error)
    return NextResponse.json(
      { error: 'Erro no upload da imagem' },
      { status: 500 }
    )
  }
}
