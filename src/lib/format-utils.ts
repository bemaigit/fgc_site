/**
 * Formata um CEP para o padrão brasileiro (00000-000)
 * @param cep String contendo apenas números ou já formatada
 * @returns CEP formatado ou string vazia se inválido
 */
export function formatCEP(cep: string | undefined | null): string {
  if (!cep) return '';
  
  // Remove todos os caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  // Verifica se tem o tamanho correto
  if (numbers.length !== 8) return numbers;
  
  // Formata como 00000-000
  return `${numbers.substring(0, 5)}-${numbers.substring(5)}`;
}

/**
 * Valida se um CEP está no formato correto
 * @param cep String contendo o CEP a ser validado
 * @returns true se o CEP é válido, false caso contrário
 */
export function isValidCEP(cep: string | undefined | null): boolean {
  if (!cep) return true; // CEP vazio é considerado válido (opcional)
  
  // Remove todos os caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  // CEP válido deve ter 8 dígitos
  return numbers.length === 8;
}

/**
 * Consulta um CEP na API ViaCEP
 * @param cep CEP a ser consultado (apenas números ou formatado)
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return null;
    }
    
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    
    // ViaCEP retorna { erro: true } quando o CEP não existe
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    return null;
  }
}

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value Valor a ser formatado
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}
