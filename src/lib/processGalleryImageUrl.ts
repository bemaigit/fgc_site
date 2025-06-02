/**
 * Utilitários para processamento de imagens de galerias
 * Este arquivo contém funções para ajudar na geração de URLs para o proxy de imagens de galerias
 */

/**
 * Processa a URL de uma imagem de galeria para usar o endpoint de proxy
 * @param url URL original da imagem
 * @returns URL processada usando o endpoint de proxy
 */
export function processGalleryImageUrl(url: string | null): string {
  // Se não houver URL, retornar imagem padrão
  if (!url) return '/images/gallery-placeholder.jpg';
  
  try {
    // Se a URL já contém o endpoint de proxy, retorná-la como está
    if (url.includes('/api/gallery/image')) {
      return url;
    }

    // Detecta URLs que já são de proxy e evita duplo processamento
    if (url.includes('/api/proxy/')) {
      // Extrair o caminho real após /storage/
      const storagePathMatch = url.match(/\/api\/proxy\/storage\/(.+)/);
      if (storagePathMatch && storagePathMatch[1]) {
        console.log(`[processGalleryImageUrl] URL de proxy detectada, extraindo caminho real:`, {
          original: url,
          extracted: storagePathMatch[1]
        });
        return `/api/gallery/image?path=${encodeURIComponent(storagePathMatch[1])}`;
      }
    }
    
    // Processa URLs de MinIO (localhost:9000, minio:9000)
    if (url.includes('minio:9000') || url.includes('localhost:9000')) {
      // Extrai o caminho após o bucket (fgc)
      const parts = url.split('/fgc/');  
      if (parts.length > 1) {
        // Pega a parte após o bucket (/fgc/)
        return `/api/gallery/image?path=${encodeURIComponent(parts[1])}`;
      }
    }
    
    // Extrair o nome do arquivo ou caminho relativo
    // Se for um caminho completo de galeria, mantém a estrutura 'galeria-de-imagens/ID/categoria/arquivo'
    let pathToUse = url;
    
    // Caso: URL completa (http://...)
    if (url.includes('://')) {
      try {
        const urlObj = new URL(url);
        pathToUse = urlObj.pathname
          .replace(/^\/storage\//, '')
          .replace(/^\/fgc\//, '');
      } catch (error) {
        console.error('Erro ao processar URL da imagem de galeria:', error);
      }
    } 
    // Caso: URL começa com /storage/
    else if (url.startsWith('/storage/')) {
      pathToUse = url.substring(9); // Remove '/storage/'
    }
    // Caso: URL começa com /fgc/
    else if (url.startsWith('/fgc/')) {
      pathToUse = url.substring(5); // Remove '/fgc/'
    }
    // Caso: Caminho começa com galeria-de-imagens/
    else if (url.startsWith('galeria-de-imagens/')) {
      pathToUse = url; // Manter como está
    }
    
    // Log detalhado em modo de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[processGalleryImageUrl] URL original: ${url}`);
      console.log(`[processGalleryImageUrl] Caminho processado: ${pathToUse}`);
    }
    
    // Retornar URL do proxy com o caminho processado
    return `/api/gallery/image?path=${encodeURIComponent(pathToUse)}`;
  } catch (error) {
    console.error('[processGalleryImageUrl] Erro ao processar URL:', error, url);
    // Em caso de erro, retorna a URL original para evitar problemas
    return url;
  }
}

/**
 * Gera caminho no MinIO para armazenar uma nova imagem de galeria
 * @param filename Nome original do arquivo (para extrair a extensão)
 * @returns Caminho completo para armazenamento no MinIO
 */
export function generateGalleryImagePath(filename: string): string {
  // Extrair extensão do arquivo
  const ext = filename.split('.').pop() || 'jpg';
  
  // Gerar um nome único baseado no timestamp e um número aleatório
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Retornar caminho completo com prefixo "galeria"
  return `galeria/${uniqueId}.${ext}`;
}
