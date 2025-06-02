# Sistema de Armazenamento

## Visão Geral

O sistema de armazenamento do FGC é projetado para ser flexível e eficiente, utilizando diferentes estratégias para ambientes de desenvolvimento e produção:

- **Desenvolvimento**: Armazenamento local para facilitar o desenvolvimento
- **Produção**: MinIO para armazenamento escalável e compatível com S3

## Configuração

### Variáveis de Ambiente

```env
# Desenvolvimento
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./public/uploads

# Produção
STORAGE_TYPE=minio
MINIO_ENDPOINT=minio.example.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=fgc-storage
```

## Implementação

### Interface de Storage

```typescript
// lib/storage/types.ts
export interface StorageProvider {
  upload(file: File | Buffer, path: string): Promise<string>
  delete(path: string): Promise<void>
  getUrl(path: string): string
}
```

### Provider Local

```typescript
// lib/storage/local.ts
import fs from 'fs'
import path from 'path'

export class LocalStorageProvider implements StorageProvider {
  private basePath: string
  private baseUrl: string

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || './public/uploads'
    this.baseUrl = '/uploads'
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath)
    const dirPath = path.dirname(fullPath)

    // Cria diretório se não existir
    await fs.promises.mkdir(dirPath, { recursive: true })

    // Salva o arquivo
    await fs.promises.writeFile(fullPath, file)

    return path.join(this.baseUrl, filePath)
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    await fs.promises.unlink(fullPath)
  }

  getUrl(filePath: string): string {
    return path.join(this.baseUrl, filePath)
  }
}
```

### Provider MinIO

```typescript
// lib/storage/minio.ts
import { Client } from 'minio'

export class MinioStorageProvider implements StorageProvider {
  private client: Client
  private bucket: string

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'fgc-storage'
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!
    })
  }

  async upload(file: Buffer, filePath: string): Promise<string> {
    await this.client.putObject(
      this.bucket,
      filePath,
      file
    )

    return this.getUrl(filePath)
  }

  async delete(filePath: string): Promise<void> {
    await this.client.removeObject(this.bucket, filePath)
  }

  getUrl(filePath: string): string {
    return `${process.env.MINIO_ENDPOINT}/${this.bucket}/${filePath}`
  }
}
```

### Factory de Storage

```typescript
// lib/storage/index.ts
import { StorageProvider } from './types'
import { LocalStorageProvider } from './local'
import { MinioStorageProvider } from './minio'

export function createStorageProvider(): StorageProvider {
  const storageType = process.env.STORAGE_TYPE || 'local'

  switch (storageType) {
    case 'minio':
      return new MinioStorageProvider()
    case 'local':
    default:
      return new LocalStorageProvider()
  }
}

// Exporta instância singleton
export const storage = createStorageProvider()
```

## API de Upload

```typescript
// app/api/upload/route.ts
import { storage } from '@/lib/storage'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(req: Request) {
  // Verifica autenticação
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return new Response('Não autorizado', { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new Response('Nenhum arquivo enviado', { status: 400 })
    }

    // Valida tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return new Response('Tipo de arquivo não permitido', { status: 400 })
    }

    // Gera nome único
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `uploads/${fileName}`

    // Converte para Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload
    const url = await storage.upload(buffer, path)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Erro no upload:', error)
    return new Response('Erro no upload', { status: 500 })
  }
}
```

## Uso em Componentes

### Hook de Upload

```typescript
// hooks/useUpload.ts
import { useState } from 'react'

interface UploadHookResult {
  uploading: boolean
  uploadFile: (file: File) => Promise<string>
  error: string | null
}

export function useUpload(): UploadHookResult {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro no upload')
      }

      const { url } = await response.json()
      return url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { uploading, uploadFile, error }
}
```

### Componente de Upload

```typescript
// components/common/FileUpload.tsx
'use client'

import { useUpload } from '@/hooks/useUpload'
import Image from 'next/image'

interface FileUploadProps {
  onUpload: (url: string) => void
  accept?: string
  maxSize?: number // em bytes
}

export function FileUpload({ 
  onUpload, 
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024 // 5MB
}: FileUploadProps) {
  const { uploading, uploadFile, error } = useUpload()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      alert('Arquivo muito grande')
      return
    }

    try {
      const url = await uploadFile(file)
      onUpload(url)
    } catch (err) {
      console.error('Erro no upload:', err)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      
      <label
        htmlFor="file-upload"
        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        {uploading ? 'Enviando...' : 'Selecionar arquivo'}
      </label>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
```

## Considerações de Produção

1. **Backup**
   - Configurar backup automático do MinIO
   - Replicação para redundância
   - Monitoramento de espaço

2. **Segurança**
   - URLs assinadas para acesso privado
   - Validação de tipos de arquivo
   - Limite de tamanho de upload
   - Sanitização de nomes de arquivo

3. **Performance**
   - Cache de arquivos estáticos
   - Compressão de imagens
   - CDN para distribuição
   - Lazy loading de imagens

4. **Manutenção**
   - Limpeza periódica de arquivos órfãos
   - Monitoramento de uso
   - Logs de acesso
   - Rotação de logs
