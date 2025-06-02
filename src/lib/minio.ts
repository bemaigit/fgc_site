import { Client } from 'minio';

// Função para extrair a porta de uma URL
function extractPortFromUrl(url: string | undefined): number {
  if (!url) return 9000;
  
  try {
    // Tenta extrair a porta usando URL
    const urlObj = new URL(url);
    if (urlObj.port) {
      return parseInt(urlObj.port, 10);
    }
    // Se não há porta especificada, usa o padrão baseado no protocolo
    return urlObj.protocol === 'https:' ? 443 : 80;
  } catch (e) {
    // Se a URL for inválida, usa a porta padrão 9000
    console.warn('URL inválida para MinIO, usando porta padrão 9000');
    return 9000;
  }
}

// Função para extrair domínio de uma URL
function extractDomainFromUrl(url: string | undefined): string {
  if (!url) return 'localhost';
  
  try {
    // Tenta extrair o hostname usando URL
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    // Se a URL for inválida, usa 'localhost'
    return 'localhost';
  }
}

// Configurar cliente MinIO
export const minioClient = new Client({
  endPoint: extractDomainFromUrl(process.env.MINIO_ENDPOINT),
  port: extractPortFromUrl(process.env.MINIO_ENDPOINT),
  useSSL: process.env.MINIO_ENDPOINT?.startsWith('https:') || false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'fgc_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'fgc_password',
  region: process.env.MINIO_REGION || 'us-east-1',
});
