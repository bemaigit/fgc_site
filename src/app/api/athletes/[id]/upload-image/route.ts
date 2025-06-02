import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import sharp from 'sharp'
import { storageService } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

// Configurar o prefixo para armazenamento das imagens de perfil
const UPLOAD_PREFIX = 'perfil atleta/'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar permissões (assumindo que há um sistema de roles/permissões)
    // Isso deve ser ajustado conforme o sistema de autenticação existente
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      )
    }

    // Verificar se o atleta existe
    const { id } = await params
    const athleteId = id
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { User_Athlete_userIdToUser: true }
    })

    if (!athlete) {
      return NextResponse.json(
        { error: 'Atleta não encontrado' },
        { status: 404 }
      )
    }

    // Processar o upload de imagem
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhuma imagem enviada' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 5MB' },
        { status: 400 }
      )
    }

    try {
      // Converter o arquivo em buffer
      const buffer = Buffer.from(await file.arrayBuffer())

      // Processar a imagem com sharp (otimizar e redimensionar)
      const processedImageBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Gerar um nome de arquivo único
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${UPLOAD_PREFIX}${fileName}`

      // Fazer upload usando o storageService
      const imageUrl = await storageService.uploadFile(processedImageBuffer, {
        filename: filePath,
        contentType: `image/${fileExtension}`,
        size: processedImageBuffer.length
      })

      console.log('Imagem enviada com sucesso:', { filePath, imageUrl })

      // Construir URL completa para compatibilidade com os componentes da página inicial
      const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
      const minioBucket = process.env.MINIO_BUCKET || 'fgc';
      const fullImageUrl = `${minioEndpoint}/${minioBucket}/${filePath}`;
      
      console.log('Salvando URL completa no banco de dados:', fullImageUrl);
      
      // Atualizar o registro do USUÁRIO no banco de dados (não o atleta)
      await prisma.user.update({
        where: { id: athlete.userId },
        data: { 
          image: fullImageUrl, // Armazenar a URL completa para compatibilidade
        },
      })

      // Retornar a URL processada pelo storageService
      return NextResponse.json({ 
        success: true, 
        imageUrl: imageUrl 
      })
    } catch (error) {
      console.error('Erro durante o upload da imagem:', error)
      return NextResponse.json(
        { error: 'Erro ao processar upload de imagem' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro ao processar upload de imagem:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload de imagem' },
      { status: 500 }
    )
  }
}
