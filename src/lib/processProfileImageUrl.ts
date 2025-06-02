/**
 * Processa uma URL de imagem de perfil para garantir que seja acessível
 * @param url URL da imagem de perfil
 * @returns URL processada para exibição
 */
export function processProfileImageUrl(url: string): string {
  if (!url) return '';
  
  console.log('Processando URL de perfil:', url);
  
  // Se já for uma URL do proxy, retorna como está
  if (url.includes('/api/athlete-gallery/image') || url.includes('/api/proxy/storage')) {
    console.log('URL já é um proxy, retornando como está');
    return url;
  }
  
  try {
    // Se for uma URL completa (http/https)
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      // Extrai o caminho após o domínio
      let path = urlObj.pathname;
      // Remove a barra inicial se existir
      path = path.startsWith('/') ? path.substring(1) : path;
      // Remove o nome do bucket (fgc/) se existir
      path = path.startsWith('fgc/') ? path.substring(4) : path;
      // Remove 'storage/' se existir
      path = path.startsWith('storage/') ? path.substring(8) : path;
      // Normaliza o caminho para usar 'perfil atleta' com espaço
      path = path.replace(/perfil-?atleta\//g, 'perfil atleta/');
      // Codifica o caminho para URL
      return `/api/athlete-gallery/image?path=${encodeURIComponent(path)}`;
    }
    
    // Se for um caminho relativo
    // Remove barras iniciais se existirem
    let cleanPath = url.replace(/^\/+/g, '');
    // Remove 'storage/' se existir no caminho
    cleanPath = cleanPath.startsWith('storage/') ? cleanPath.substring(8) : cleanPath;
    // Remove 'fgc/' se existir
    cleanPath = cleanPath.startsWith('fgc/') ? cleanPath.substring(4) : cleanPath;
    // Normaliza o caminho para usar 'perfil atleta' com espaço, aceitando tanto hífen quanto espaço
    cleanPath = cleanPath.replace(/perfil-?atleta\//g, 'perfil atleta/');
    
    // Se o caminho já começar com 'perfil atleta/', retorna como está
    if (cleanPath.startsWith('perfil atleta/')) {
      return `/api/athlete-gallery/image?path=${encodeURIComponent(cleanPath)}`;
    }
    
    // Se não tiver nenhum prefixo, adiciona 'perfil atleta/'
    return `/api/athlete-gallery/image?path=${encodeURIComponent('perfil atleta/' + cleanPath)}`;
    
  } catch (error) {
    console.error('Erro ao processar URL de perfil:', error);
    console.error('URL problemática:', url);
    // Em caso de erro, retorna a URL original
    return url;
  }
}
