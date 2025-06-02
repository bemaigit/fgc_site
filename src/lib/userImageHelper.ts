/**
 * Utilitários para processamento de imagens de perfil de usuários
 * Este arquivo contém funções para ajudar na geração de URLs para o proxy de imagens de usuários
 */

/**
 * Gera URL para o proxy de imagens de perfil
 * @param originalUrl URL original da imagem (pode ser relativa ou absoluta)
 * @returns URL formatada para acessar através do proxy
 */
export function generateUserImageProxyUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // Se a URL já contém o endpoint de proxy, retorná-la como está
  if (originalUrl.includes('/api/user/image')) {
    return originalUrl;
  }
  
  // Processar o caminho para garantir compatibilidade
  let processedPath = originalUrl;
  
  // Caso 1: Se for uma URL completa, extrair apenas o caminho
  if (originalUrl.includes('://')) {
    try {
      const urlObj = new URL(originalUrl);
      processedPath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
    } catch (error) {
      console.error('Erro ao processar URL de imagem de perfil:', error);
    }
  } 
  // Caso 2: Se começar com /storage/, remover esse prefixo
  else if (originalUrl.startsWith('/storage/')) {
    processedPath = originalUrl.substring(9); // Remove '/storage/'
  }
  // Caso 3: Se começar com /fgc/, remover esse prefixo
  else if (originalUrl.startsWith('/fgc/')) {
    processedPath = originalUrl.substring(5); // Remove '/fgc/'
  }
  
  // Determinar a base URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                 (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  // Construir URL para o proxy de imagens
  return `${baseUrl}/api/user/image?path=${encodeURIComponent(processedPath)}`;
}

/**
 * Gera caminho no MinIO para armazenar uma nova imagem de perfil
 * @param filename Nome original do arquivo (para extrair a extensão)
 * @returns Caminho completo para armazenamento no MinIO
 */
export function generateUserImagePath(filename: string): string {
  // Extrair extensão do arquivo
  const ext = filename.split('.').pop() || 'jpg';
  
  // Gerar um nome único baseado no timestamp e um número aleatório
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Retornar caminho completo com prefixo "perfil atleta" (com espaço)
  return `perfil atleta/${uniqueId}.${ext}`;
}
