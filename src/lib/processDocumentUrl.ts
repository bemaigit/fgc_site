/**
 * Utilitário para processar URLs de documentos
 * Seguindo o mesmo padrão usado para imagens, notícias e galerias
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Processa a URL de um documento para usar o endpoint de proxy
 * @param url URL do documento ou caminho relativo
 * @returns URL processada para o proxy
 */
export function processDocumentUrl(url: string | null): string {
  // Se não houver URL, retornar string vazia
  if (!url) return '';

  try {
    // Se a URL já for um caminho de proxy, retorná-la como está
    if (url.startsWith('/api/documents/file')) {
      return url;
    }

    // Se for uma URL completa para o MinIO, extrair o caminho
    if (url.includes('minio') || url.includes('.amazonaws.com')) {
      // Extrair o caminho após o bucket e prefixo documentos/
      const parts = url.split('documentos/');
      if (parts.length > 1) {
        return `/api/documents/file?path=${encodeURIComponent(parts[1])}`;
      }
    }

    // Se for apenas um nome de arquivo sem caminho completo
    if (!url.includes('/')) {
      return `/api/documents/file?path=${encodeURIComponent(url)}`;
    }

    // Se for um caminho relativo mas não começar com /api
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      return `/api/documents/file?path=${encodeURIComponent(url)}`;
    }

    // Caso contrário, retornar a URL original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL de documento:', error);
    return url;
  }
}

/**
 * Gera um caminho de armazenamento para o documento
 * @param fileName Nome do arquivo
 * @returns Caminho onde o documento será armazenado
 */
export function generateDocumentPath(fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitizedFileName}`;
}
