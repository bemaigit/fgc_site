/**
 * Utilitário para processar URLs de imagens de parceiros
 * Seguindo o mesmo padrão usado para notícias, galerias e documentos
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Processa a URL de uma imagem de parceiro para usar o endpoint de proxy
 * @param url URL da imagem ou caminho relativo
 * @returns URL processada para o proxy
 */
export function processPartnerImageUrl(url: string | null): string {
  // Se não houver URL, retornar imagem padrão
  if (!url) return '/images/partner-placeholder.jpg';

  try {
    // Se a URL já for um caminho de proxy, retorná-la como está
    if (url.startsWith('/api/partners/image')) {
      return url;
    }

    // Se for uma URL completa para o MinIO, extrair o caminho
    if (url.includes('minio') || url.includes('.amazonaws.com')) {
      // Extrair o caminho após o bucket ou prefixo parceiros/
      if (url.includes('parceiros/')) {
        const parts = url.split('parceiros/');
        if (parts.length > 1) {
          return `/api/partners/image?path=${encodeURIComponent(parts[1])}`;
        }
      }
      
      // Se não encontrar o prefixo específico, extrair o caminho após o bucket
      const parts = url.split('/');
      if (parts.length > 3) {
        // Remover o protocolo, hostname e nome do bucket
        const path = parts.slice(3).join('/');
        return `/api/partners/image?path=${encodeURIComponent(path)}`;
      }
    }

    // Se for apenas um nome de arquivo sem caminho completo
    if (!url.includes('/')) {
      return `/api/partners/image?path=${encodeURIComponent(url)}`;
    }

    // Se for um caminho relativo mas não começar com /api
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      return `/api/partners/image?path=${encodeURIComponent(url)}`;
    }

    // Caso contrário, retornar a URL original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL de parceiro:', error);
    return url;
  }
}

/**
 * Gera um caminho de armazenamento para a imagem do parceiro
 * @param fileName Nome do arquivo
 * @returns Caminho onde a imagem será armazenada
 */
export function generatePartnerImagePath(fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitizedFileName}`;
}
