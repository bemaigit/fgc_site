/**
 * Utilitário para processar URLs de logos do footer
 * Seguindo o mesmo padrão usado para as outras seções do site
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Processa a URL de uma logo do footer para usar o endpoint de proxy
 * @param url URL da logo ou caminho relativo
 * @returns URL processada para o proxy
 */
export function processFooterLogoUrl(url: string | null): string {
  // Se não houver URL, retornar logo padrão da FGC
  if (!url) return '/images/logo-fgc.png';

  // Se for a logo padrão, retorná-la como está (já está em /public)
  if (url === '/images/logo-fgc.png') {
    return url;
  }

  try {
    // Se a URL já for um caminho de proxy, retorná-la como está
    if (url.startsWith('/api/footer/logo')) {
      return url;
    }

    // Se for uma URL completa para o MinIO ou para o domínio da aplicação, extrair o caminho
    if (url.includes('minio') || url.includes('.amazonaws.com') || url.includes('dev.bemai.com.br') || url.includes('bemai.com.br')) {
      // Extrair o caminho após o prefixo footer/
      if (url.includes('footer/')) {
        const parts = url.split('footer/');
        if (parts.length > 1) {
          return `/api/footer/logo?path=${encodeURIComponent(parts[1])}`;
        }
      }
      
      // Extrair o caminho após storage/ (formato usado no banco de dados)
      if (url.includes('storage/footer/')) {
        const parts = url.split('storage/footer/');
        if (parts.length > 1) {
          return `/api/footer/logo?path=${encodeURIComponent(parts[1])}`;
        }
      }
      
      // Se não encontrar o prefixo específico, extrair o caminho após o bucket
      const parts = url.split('/');
      if (parts.length > 3) {
        // Remover o protocolo, hostname e nome do bucket
        const path = parts.slice(3).join('/');
        return `/api/footer/logo?path=${encodeURIComponent(path)}`;
      }
    }

    // Se for apenas um nome de arquivo sem caminho completo
    if (!url.includes('/')) {
      return `/api/footer/logo?path=${encodeURIComponent(url)}`;
    }

    // Se for um caminho relativo mas não começar com /api ou /images
    if (!url.startsWith('/api') && !url.startsWith('/images') && !url.startsWith('http')) {
      return `/api/footer/logo?path=${encodeURIComponent(url)}`;
    }

    // Caso contrário, retornar a URL original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL de logo do footer:', error);
    return url;
  }
}

/**
 * Gera um caminho de armazenamento para a logo do footer
 * @param fileName Nome do arquivo
 * @returns Caminho onde a imagem será armazenada
 */
export function generateFooterLogoPath(fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitizedFileName}`;
}
