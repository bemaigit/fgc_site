import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const imageUploadSchema = z.object({
  type: z.enum(['cover', 'poster'])
})

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Processa o form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    // Valida os dados
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const result = imageUploadSchema.safeParse({ type })
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Configura o prefixo para o tipo de imagem
    const prefix = `eventos/${type}`
    storageService.setPrefix(prefix)

    // Lê o arquivo como buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para o Minio
    const url = await storageService.uploadFile(buffer, {
      filename: file.name,
      contentType: file.type,
      size: buffer.length
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    )
  }
}
