/**
 * Utilitário centralizado para geração de protocolos.
 * Este arquivo contém funções padronizadas para geração e normalização
 * de protocolos de inscrição, pagamentos e outros recursos do sistema.
 */

/**
 * Gera um protocolo de evento no formato padronizado EVE-YYYYMMDD-XXXX
 * @returns string Protocolo no formato EVE-YYYYMMDD-XXXX
 */
export function generateEventProtocol(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  return `EVE-${year}${month}${day}-${randomPart}`;
}

/**
 * Gera um protocolo de pagamento no formato padronizado PAY-YYYYMMDD-XXXX
 * @returns string Protocolo no formato PAY-YYYYMMDD-XXXX
 */
export function generatePaymentProtocol(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  return `PAY-${year}${month}${day}-${randomPart}`;
}

/**
 * Gera um protocolo com prefixo personalizado
 * @param prefix Prefixo a ser usado (ex: "REG", "MEM")
 * @returns string Protocolo no formato PREFIX-YYYYMMDD-XXXX
 */
export function generateCustomProtocol(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  return `${prefix.toUpperCase()}-${year}${month}${day}-${randomPart}`;
}

/**
 * Normaliza um protocolo para facilitar buscas no banco de dados
 * @param protocol Protocolo a ser normalizado
 * @returns Array de variações do protocolo para busca
 */
export function normalizeProtocol(protocol: string): string[] {
  if (!protocol) return [];
  
  // Extrair o número base do protocolo removendo qualquer prefixo
  const baseProtocol = protocol.replace(/^[A-Z]+-/, '');
  
  // Gerar variações com diferentes prefixos
  return [
    protocol,                        // Protocolo original
    baseProtocol,                    // Sem prefixo
    `EVE-${baseProtocol}`,           // Com prefixo EVE-
    `REG-${baseProtocol}`,           // Com prefixo REG-
    `PAY-${baseProtocol}`,           // Com prefixo PAY-
    protocol.toUpperCase(),          // Versão em maiúsculas
    protocol.toLowerCase()           // Versão em minúsculas
  ];
}

/**
 * Extrai a data de um protocolo no formato padrão
 * @param protocol Protocolo no formato PREFIX-YYYYMMDD-XXXX
 * @returns Date objeto de data ou null se não for possível extrair
 */
export function extractDateFromProtocol(protocol: string): Date | null {
  if (!protocol) return null;
  
  // Tenta extrair a data do protocolo
  const match = protocol.match(/\d{8}/);
  if (!match) return null;
  
  const dateStr = match[0];
  try {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Meses em JS são 0-11
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(year, month, day);
  } catch (error) {
    return null;
  }
}
