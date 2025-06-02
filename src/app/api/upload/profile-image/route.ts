"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { v4 as uuidv4 } from "uuid"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Configuração do cliente S3/MinIO (usando variáveis de ambiente)
const s3Config = {
  region: process.env.MINIO_REGION || 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT,
  forcePathStyle: true, // Necessário para MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
}

const s3Client = new S3Client(s3Config)
const BUCKET_NAME = process.env.MINIO_BUCKET || 'fgc'

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo encontrado" },
        { status: 400 }
      )
    }
    
    // Verificar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande, o tamanho máximo é 5MB" },
        { status: 400 }
      )
    }
    
    // Verificar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Apenas JPEG, PNG e WEBP são permitidos" },
        { status: 400 }
      )
    }
    
    // Ler o conteúdo do arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Processar a imagem com sharp (otimizar e redimensionar)
    const processedImageBuffer = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    
    // Gerar um nome de arquivo único
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `perfil atleta/${uuidv4()}.${fileExtension}`
    
    // Fazer upload para o S3/MinIO
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: processedImageBuffer,
        ContentType: `image/jpeg`,
      })
    )
    
    // URL para a imagem (ajuste conforme sua configuração)
    const minio_endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const bucket_name = process.env.MINIO_BUCKET || 'fgc';
    const imageUrl = `${minio_endpoint}/${bucket_name}/${fileName}`
    
    return NextResponse.json({ 
      url: imageUrl,
      success: true
    })
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error)
    return NextResponse.json(
      { error: "Erro ao processar upload do arquivo" },
      { status: 500 }
    )
  }
}
