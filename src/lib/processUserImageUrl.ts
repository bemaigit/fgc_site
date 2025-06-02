/**
 * Processa URLs de imagens de perfil de usuários para utilizar o endpoint de proxy
 * Este utilitário garante que todas as imagens de perfil sejam servidas através do endpoint de proxy,
 * evitando problemas de CORS e garantindo consistência entre ambientes
 */

/**
 * Processa a URL de uma imagem de perfil para usar o endpoint de proxy
 * @param url URL original da imagem
 * @returns URL processada usando o endpoint de proxy
 */
export function processUserImageUrl(url: string | null | undefined): string {
  // Se não houver URL, retornar imagem padrão
  if (!url) return '/images/placeholder-athlete.jpg';
  
  // Se a URL já contém o endpoint de proxy, retorná-la como está
  if (url.includes('/api/user/image')) {
    return url;
  }
  
  // Processar o caminho para garantir compatibilidade com diferentes formatos
  let processedPath = url;
  
  // Caso 1: Se for uma URL completa, extrair apenas o caminho
  if (url.includes('://')) {
    try {
      const urlObj = new URL(url);
      processedPath = urlObj.pathname
        .replace(/^\/storage\//, '')
        .replace(/^\/fgc\//, '');
      
      // Se o caminho não incluir o prefixo 'perfil atleta/', adicioná-lo
      if (!processedPath.includes('perfil atleta/')) {
        // Extrair apenas o nome do arquivo, descartando qualquer estrutura de diretório incorreta
        const filename = processedPath.split('/').pop();
        if (filename) {
          processedPath = `perfil atleta/${filename}`;
        }
      }
    } catch (error) {
      console.error('Erro ao processar URL da imagem de perfil:', error);
    }
  } 
  // Caso 2: Se começar com /storage/, remover esse prefixo
  else if (url.startsWith('/storage/')) {
    processedPath = url.substring(9); // Remove '/storage/'
  }
  // Caso 3: Se começar com /fgc/, remover esse prefixo
  else if (url.startsWith('/fgc/')) {
    processedPath = url.substring(5); // Remove '/fgc/'
  }
  
  // Construir URL para o proxy de imagens
  // Correção da sintaxe da expressão ternária
  let baseUrl = '';
  
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  } else if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else {
    baseUrl = 'http://localhost:3000';
  }
  
  return `${baseUrl}/api/user/image?path=${encodeURIComponent(processedPath)}`;
}
