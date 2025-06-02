/**
 * Utilitário para processar URLs de documentos de eventos (regulamentos, resultados)
 * Este arquivo contém funções para ajudar na geração de URLs para o proxy de documentos de eventos
 */

/**
 * Processa a URL de um documento de evento para usar o endpoint de proxy correto
 * @param url URL original do documento
 * @param type Tipo de documento ('regulation' ou 'results')
 * @returns URL processada usando o endpoint de proxy adequado
 */
export function processEventDocumentUrl(url: string | null, type: 'regulation' | 'results' = 'regulation'): string {
  // Se não houver URL, retornar string vazia
  if (!url) return '';
  
  try {
    // Se a URL já contém o endpoint de proxy correto, retorná-la como está
    const proxyEndpoint = type === 'regulation' ? '/api/events/regulation' : '/api/events/results';
    if (url.includes(proxyEndpoint)) {
      return url;
    }

    // Processar o caminho para garantir compatibilidade com diferentes formatos
    let processedPath = url;
    
    // Caso: URL de proxy genérico
    if (url.includes('/api/proxy/')) {
      const storagePathMatch = url.match(/\/api\/proxy\/storage\/(.+)/);
      if (storagePathMatch && storagePathMatch[1]) {
        processedPath = storagePathMatch[1];
        console.log(`[processEventDocumentUrl] URL de proxy detectada, extraindo caminho real:`, {
          original: url,
          extracted: processedPath,
          type
        });
      }
    }
    // Caso: URL do MinIO
    else if (url.includes('minio:9000') || url.includes('localhost:9000')) {
      // Extrai o caminho após o bucket (fgc)
      const parts = url.split('/fgc/');  
      if (parts.length > 1) {
        processedPath = parts[1];
      }
    }
    // Caso: URL completa
    else if (url.includes('://')) {
      try {
        const urlObj = new URL(url);
        processedPath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
      } catch (error) {
        console.error('Erro ao processar URL do documento:', error);
      }
    }
    // Caso: URL com prefixos específicos
    else if (url.startsWith('/storage/')) {
      processedPath = url.substring(9); // Remove '/storage/'
    }
    else if (url.startsWith('/fgc/')) {
      processedPath = url.substring(5); // Remove '/fgc/'
    }
    else if (url.startsWith('storage/')) {
      processedPath = url.substring(8); // Remove 'storage/'
    }
    else if (url.startsWith('fgc/')) {
      processedPath = url.substring(4); // Remove 'fgc/'
    }
    
    // Log para depuração
    if (process.env.NODE_ENV === 'development') {
      console.log(`[processEventDocumentUrl] URL original: ${url}`);
      console.log(`[processEventDocumentUrl] Caminho processado: ${processedPath}`);
      console.log(`[processEventDocumentUrl] Tipo de documento: ${type}`);
    }
    
    // Retornar URL usando o endpoint específico para o tipo de documento
    return `${proxyEndpoint}?path=${encodeURIComponent(processedPath)}`;
  } catch (error) {
    console.error('[processEventDocumentUrl] Erro ao processar URL:', error, url);
    // Em caso de erro, retorna a URL original
    return url;
  }
}
