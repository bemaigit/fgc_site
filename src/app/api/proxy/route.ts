import { NextRequest, NextResponse } from 'next/server'
import { storageService } from '@/lib/storage'

// Esta API atua como um proxy para imagens armazenadas no MinIO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new Response('URL não fornecida', { status: 400 })
    }

    // Limpa a URL, removendo qualquer codificação URL
    const decodedUrl = decodeURIComponent(url)
    console.log('URL decodificada:', decodedUrl)
    
    // Verifica se é uma URL da galeria com paramétro path
    let fileKey = decodedUrl
    if (decodedUrl.includes('/api/athlete-gallery/image') && decodedUrl.includes('?path=')) {
      // Extrai o valor do parâmetro path
      const pathMatch = decodedUrl.match(/[?&]path=([^&]+)/)
      if (pathMatch && pathMatch[1]) {
        fileKey = decodeURIComponent(pathMatch[1])
        console.log('Path extraído da URL da galeria:', fileKey)
      }
    }
    
    // Obter o arquivo do MinIO
    console.log('Buscando arquivo com chave:', fileKey)
    const file = await storageService.getFile(fileKey)
    
    if (!file) {
      console.log('Arquivo não encontrado:', decodedUrl)
      // Redirecionar para uma imagem padrão
      return NextResponse.redirect(new URL('/images/placeholder-banner.jpg', request.url))
    }

    // Determinar o tipo de conteúdo correto com base na extensão do arquivo
    let contentType = 'application/octet-stream'
    if (decodedUrl.endsWith('.jpg') || decodedUrl.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (decodedUrl.endsWith('.png')) {
      contentType = 'image/png'
    } else if (decodedUrl.endsWith('.gif')) {
      contentType = 'image/gif'
    } else if (decodedUrl.endsWith('.webp')) {
      contentType = 'image/webp'
    } else if (decodedUrl.endsWith('.svg')) {
      contentType = 'image/svg+xml'
    }

    // Retorna a imagem com o content-type correto
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
      }
    })
  } catch (error) {
    console.error('Erro no proxy de imagem:', error)
    return new Response('Erro ao processar imagem', { status: 500 })
  }
}
