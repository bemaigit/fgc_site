/**
 * Utilitários para processamento de imagens de eventos
 * Este arquivo contém funções para ajudar na geração de URLs para o proxy de imagens de eventos
 */

/**
 * Processa a URL de uma imagem de evento para usar o endpoint de proxy
 * @param url URL original da imagem
 * @returns URL processada usando o endpoint de proxy
 */
export function processEventImageUrl(url: string | null): string {
  // Se não houver URL, retornar imagem padrão
  if (!url) return '/images/event-placeholder.jpg';
  
  // Se a URL já contém o endpoint de proxy, retorná-la como está
  if (url.includes('/api/events/image')) {
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
    } catch (error) {
      console.error('Erro ao processar URL da imagem de evento:', error);
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
  // Caso 4: Se começar com storage/, remover esse prefixo
  else if (url.startsWith('storage/')) {
    processedPath = url.substring(8); // Remove 'storage/'
  }
  // Caso 5: Se começar com fgc/, remover esse prefixo
  else if (url.startsWith('fgc/')) {
    processedPath = url.substring(4); // Remove 'fgc/'
  }
  
  // Logar para depuração
  if (process.env.NODE_ENV === 'development') {
    console.log(`[processEventImageUrl] Processando caminho: ${processedPath}`);
  }
  
  // Construir o URL para o proxy de imagens
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  
  return `${baseUrl}/api/events/image?path=${encodeURIComponent(processedPath)}`;
}

/**
 * Gera caminho no MinIO para armazenar uma nova imagem de evento
 * @param filename Nome original do arquivo (para extrair a extensão)
 * @returns Caminho completo para armazenamento no MinIO
 */
export function generateEventImagePath(filename: string): string {
  // Extrair extensão do arquivo
  const ext = filename.split('.').pop() || 'jpg';
  
  // Gerar um nome único baseado no timestamp e um número aleatório
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Retornar caminho completo com prefixo "eventos"
  return `eventos/${uniqueId}.${ext}`;
}
