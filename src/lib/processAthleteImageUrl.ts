/**
 * Utilitário para processar URLs de imagens de atletas
 * Seguindo o mesmo padrão usado para as outras seções do site
 */

// Caminho padrão para imagens de perfil
const DEFAULT_PROFILE_IMAGE = '/images/user-placeholder.png';

// Prefixos de caminho que indicam que a imagem já está no formato correto
const KNOWN_PREFIXES = [
  'athlete/profile/',
  'athlete/gallery/',
  'athlete/'
];

/**
 * Processa a URL de uma imagem de atleta para usar o endpoint de proxy
 * @param url URL da imagem ou caminho relativo
 * @returns URL processada para o proxy
 */
export function processAthleteImageUrl(url: string | null): string {
  // Se não houver URL, retornar imagem padrão
  if (!url || url.trim() === '') {
    return DEFAULT_PROFILE_IMAGE;
  }

  // Se for a imagem padrão, retorná-la como está (já está em /public)
  if (url === DEFAULT_PROFILE_IMAGE || url.includes('user-placeholder')) {
    return DEFAULT_PROFILE_IMAGE;
  }

  try {
    // Se a URL já for um caminho de proxy, retorná-la como está
    if (url.startsWith('/api/athletes/image') || url.startsWith('/api/proxy/')) {
      return url;
    }

    // Se for uma URL completa (http ou https)
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        
        // Extrair o caminho e decodificar caracteres especiais
        let path = decodeURIComponent(urlObj.pathname);
        
        // Remover barras iniciais
        path = path.replace(/^\/+/, '');
        
        // Se o caminho já começar com um dos prefixos conhecidos, usá-lo diretamente
        if (KNOWN_PREFIXES.some(prefix => path.startsWith(prefix))) {
          return `/api/athletes/image?path=${encodeURIComponent(path)}`;
        }
        
        // Se for do MinIO/S3, tentar extrair o caminho após o bucket
        if (urlObj.hostname.includes('minio') || 
            urlObj.hostname.includes('s3.') || 
            urlObj.hostname.includes('amazonaws.com') ||
            urlObj.hostname.includes('localhost')) {
          
          console.log('[processAthleteImageUrl] URL do MinIO detectada:', url);
          
          // Extrair o caminho após o bucket
          const pathParts = path.split('/').filter(Boolean);
          if (pathParts.length > 1) {
            // Remover o nome do bucket (primeira parte do caminho)
            const relativePath = pathParts.slice(1).join('/');
            
            // Verificar se inclui 'perfil atleta' e ajustar
            if (relativePath.includes('perfil atleta')) {
              const fileName = relativePath.split('/').pop();
              return `/api/athletes/image?path=athlete/profile/${encodeURIComponent(fileName || '')}`;
            }
            
            return `/api/athletes/image?path=${encodeURIComponent(relativePath)}`;
          }
        }
      } catch (e) {
        console.error('Erro ao processar URL:', url, e);
        return DEFAULT_PROFILE_IMAGE;
      }
    }

    // Se for um caminho que já começa com um dos prefixos conhecidos
    for (const prefix of KNOWN_PREFIXES) {
      if (url.startsWith(prefix)) {
        return `/api/athletes/image?path=${encodeURIComponent(url)}`;
      }
    }

    // Se for um caminho que começa com 'storage/', remover esse prefixo
    if (url.startsWith('storage/')) {
      const cleanPath = url.replace(/^storage\//, '');
      return `/api/athletes/image?path=${encodeURIComponent(cleanPath)}`;
    }

    // Se for apenas um nome de arquivo sem caminho completo, assumir que é uma imagem de perfil
    if (!url.includes('/')) {
      return `/api/athletes/image?path=athlete/profile/${encodeURIComponent(url)}`;
    }

    // Se for um caminho relativo mas não começar com /api ou /images
    if (!url.startsWith('/api') && !url.startsWith('/images')) {
      // Adicionar o prefixo padrão para imagens de perfil
      return `/api/athletes/image?path=athlete/profile/${encodeURIComponent(url.split('/').pop() || '')}`;
    }

    // Caso contrário, retornar a URL original
    return url;
  } catch (error) {
    console.error('Erro ao processar URL de imagem de atleta:', url, error);
    return DEFAULT_PROFILE_IMAGE;
  }
}

/**
 * Gera um caminho único para upload de imagens de perfil de atleta
 * @param fileName Nome original do arquivo
 * @returns Caminho completo para o arquivo
 */
export function generateAthleteProfilePath(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `athlete/profile/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
}

// A função generateAthleteGalleryPath foi movida para processAthleteGalleryUrl.ts
// para evitar duplicação de código e inconsistências nos caminhos
