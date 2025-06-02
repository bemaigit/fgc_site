import { generateUserImageProxyUrl } from './userImageHelper'

/**
 * Processa uma URL de galeria de atleta para usar o proxy local
 * @param url URL completa do MinIO ou caminho relativo
 * @returns URL processada para usar o proxy
 */
/**
 * Processa uma URL de galeria de atleta para usar o proxy local
 * @param url URL completa do MinIO ou caminho relativo
 * @returns URL processada para usar o proxy
 */
export function processAthleteGalleryUrl(url: string): string {
  if (!url) return ''
  
  console.log('Processando URL da galeria:', url)
  
  // Se já for uma URL do proxy, retorna como está
  if (url.startsWith('/api/athlete-gallery/image')) {
    console.log('URL já é um proxy, retornando como está')
    return url
  }
  
  try {
    console.log('Processando URL da galeria:', url);
    
    // Se a URL estiver vazia, retorna vazio
    if (!url) {
      console.error('URL vazia fornecida');
      return '';
    }
    
    // Se for uma URL do proxy, retorna como está
    if (url.includes('/api/athlete-gallery/image')) {
      console.log('URL já é um proxy, retornando como está');
      return url;
    }
    
    // Se for uma URL completa, extrai apenas o nome do arquivo
    if (url.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        let fileName = pathParts[pathParts.length - 1];
        
        if (!fileName) {
          console.error('Não foi possível extrair o nome do arquivo da URL:', url);
          return '';
        }
        
        // Remove parâmetros de consulta, se houver
        fileName = fileName.split('?')[0];
        
        // Se o nome do arquivo estiver vazio após remover os parâmetros, tenta pegar o penúltimo segmento
        if (!fileName && pathParts.length > 1) {
          fileName = pathParts[pathParts.length - 2];
        }
        
        if (!fileName) {
          console.error('Não foi possível extrair um nome de arquivo válido da URL:', url);
          return '';
        }
        
        // Codifica o nome do arquivo para URL
        const encodedFileName = encodeURIComponent(fileName);
        
        // Retorna a URL do endpoint de imagem
        const imageUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodedFileName}`;
        console.log('URL de imagem gerada a partir de URL completa:', imageUrl);
        return imageUrl;
      } catch (error) {
        console.error('Erro ao processar URL completa:', error);
        return '';
      }
    }
    
    // Se for apenas um nome de arquivo, assume que está na pasta athlete-gallery
    if (!url.includes('/') && !url.startsWith('athlete-gallery/')) {
      const encodedFileName = encodeURIComponent(url);
      const imageUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodedFileName}`;
      console.log('URL de imagem gerada a partir de nome de arquivo:', imageUrl);
      return imageUrl;
    }
    
    // Se for um caminho relativo, extrai apenas o nome do arquivo
    let fileName = url;
    
    // Remove o prefixo 'athlete-gallery/' se existir
    if (fileName.startsWith('athlete-gallery/')) {
      fileName = fileName.substring('athlete-gallery/'.length);
    }
    
    // Remove barras iniciais e finais
    fileName = fileName.replace(/^\/+|\/+$/g, '');
    
    // Pega apenas o nome do arquivo (última parte do caminho)
    const pathParts = fileName.split('/');
    fileName = pathParts[pathParts.length - 1];
    
    if (!fileName) {
      console.error('Não foi possível extrair o nome do arquivo do caminho:', url);
      return '';
    }
    
    // Remove parâmetros de consulta, se houver
    fileName = fileName.split('?')[0];
    
    // Se ainda não tiver um nome de arquivo, retorna vazio
    if (!fileName) {
      console.error('Nome do arquivo vazio após processamento:', url);
      return '';
    }
    
    // Codifica o nome do arquivo para URL
    const encodedFileName = encodeURIComponent(fileName);
    
    // Retorna a URL do endpoint de imagem
    const imageUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodedFileName}`;
    console.log('URL de imagem gerada a partir de caminho relativo:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('Erro ao processar URL de galeria:', error);
    console.error('URL problemática:', url);
    // Em caso de erro, retorna a URL original
    return url;
  }
}

/**
 * Gera um caminho único para upload de imagem de galeria de atleta
 * @param fileName Nome original do arquivo
 * @returns Caminho único para upload
 */
export function generateAthleteGalleryPath(fileName: string): string {
  // Remove caracteres especiais e espaços do nome do arquivo
  const cleanName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Extrai a extensão do arquivo
  const ext = cleanName.split('.').pop()?.toLowerCase() || 'jpg'
  
  // Gera um nome de arquivo único com timestamp e string aleatória
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  
  // Retorna o caminho completo sem o prefixo 'storage/'
  return `athlete-gallery/${uniqueName}`
}
