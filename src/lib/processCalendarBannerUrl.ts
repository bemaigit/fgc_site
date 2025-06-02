/**
 * Utilitário para processar URLs de banners do calendário
 * Seguindo o mesmo padrão usado para as outras seções do site
 */

/**
 * Processa a URL de um banner do calendário para usar o endpoint de proxy
 * @param url URL da imagem ou caminho relativo
 * @returns URL processada para o proxy
 */
export function processCalendarBannerUrl(url: string | null): string {
  // Se não houver URL, retornar imagem padrão
  if (!url) return '/images/calendar-banner-placeholder.jpg';

  // Para debugging
  console.log('Processando URL do banner de calendário:', url);

  try {
    // Verificar se a URL já contém o padrão 'image?path=' ou similar
    // Este caso ocorre quando há uma URL malformada com parâmetros duplicados
    if (url.includes('image?path=')) {
      // Extrair apenas o valor real do path
      const pathMatch = url.match(/image\?path=([^&]+)/);
      if (pathMatch && pathMatch[1]) {
        // Decodificar e usar apenas o valor real
        const decodedPath = decodeURIComponent(pathMatch[1]);
        return `/api/banner/calendar/image?path=${encodeURIComponent(decodedPath)}&t=${Date.now()}`;
      }
    }

    // Se a URL já for um caminho de proxy, apenas garantir que tenha timestamp
    if (url.startsWith('/api/banner/calendar/image')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    }

    // Se for uma URL completa para o MinIO ou para o domínio da aplicação
    if (url.includes('minio') || 
        url.includes('.amazonaws.com') || 
        url.includes('dev.bemai.com.br') || 
        url.includes('bemai.com.br') ||
        url.includes('localhost:9000')) {
      
      // Tratar URLs para caminhos específicos
      if (url.includes('/banners/calendario/')) {
        const parts = url.split('/banners/calendario/');
        if (parts.length > 1) {
          return `/api/banner/calendar/image?path=banners/calendario/${encodeURIComponent(parts[1])}&t=${Date.now()}`;
        }
      }
      
      // Tentar extrair a partir de outros formatos de caminho
      if (url.includes('/calendario/')) {
        const parts = url.split('/calendario/');
        if (parts.length > 1) {
          return `/api/banner/calendar/image?path=calendario/${encodeURIComponent(parts[1])}&t=${Date.now()}`;
        }
      }
      
      // Tratar outras estruturas de caminho
      if (url.includes('/fgc/')) {
        const parts = url.split('/fgc/');
        if (parts.length > 1) {
          return `/api/banner/calendar/image?path=${encodeURIComponent(parts[1])}&t=${Date.now()}`;
        }
      }
      
      // Último recurso: extrair apenas o nome do arquivo
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `/api/banner/calendar/image?path=${encodeURIComponent(filename)}&t=${Date.now()}`;
    }

    // Se for apenas um nome de arquivo ou caminho relativo
    if (!url.startsWith('/api') && !url.startsWith('/images') && !url.startsWith('http')) {
      // Garantir que não temos parâmetros duplicados
      const cleanPath = url.replace(/image\?path=/g, '');
      // Se não tiver caminho do calendário, adicionar
      if (!cleanPath.includes('calendario/')) {
        return `/api/banner/calendar/image?path=banners/calendario/${encodeURIComponent(cleanPath)}&t=${Date.now()}`;
      }
      return `/api/banner/calendar/image?path=${encodeURIComponent(cleanPath)}&t=${Date.now()}`;
    }

    // Para URLs com formato de imagem padrão, retornar como estão
    if (url.startsWith('/images/')) {
      return url;
    }

    // Caso contrário, retornar a URL original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL de banner do calendário:', error, {url});
    return '/images/calendar-banner-placeholder.jpg';
  }
}
