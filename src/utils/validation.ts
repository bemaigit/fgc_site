/**
 * Utilitários para validação de dados
 */

/**
 * Verifica se um número de telefone está em formato válido para WhatsApp
 * @param phoneNumber Número de telefone a ser validado
 * @returns true se o número estiver no formato válido
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Remove caracteres não numéricos
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Verifica se o número tem pelo menos 10 dígitos (DDD + número)
  // e se começa com 55 (código do Brasil)
  if (cleanNumber.length < 10) return false;
  
  // Para números brasileiros, verifica se começa com 55
  if (cleanNumber.startsWith('55')) {
    // Verifica se após o 55 tem um número de DDD válido (2 dígitos)
    const ddd = cleanNumber.substring(2, 4);
    const validDDDs = ['11', '12', '13', '14', '15', '16', '17', '18', '19', 
                       '21', '22', '24', '27', '28', '31', '32', '33', '34', 
                       '35', '37', '38', '41', '42', '43', '44', '45', '46', 
                       '47', '48', '49', '51', '53', '54', '55', '61', '62', 
                       '63', '64', '65', '66', '67', '68', '69', '71', '73', 
                       '74', '75', '77', '79', '81', '82', '83', '84', '85', 
                       '86', '87', '88', '89', '91', '92', '93', '94', '95', 
                       '96', '97', '98', '99'];
    if (!validDDDs.includes(ddd)) return false;
    
    // Verifica se após o DDD tem um número válido (8 ou 9 dígitos)
    const number = cleanNumber.substring(4);
    return number.length >= 8 && number.length <= 9;
  }
  
  // Para números de outros países, apenas verifica o comprimento mínimo
  return cleanNumber.length >= 10 && cleanNumber.length <= 15;
}

/**
 * Valida um endereço de e-mail
 * @param email Endereço de e-mail a ser validado
 * @returns true se o e-mail estiver no formato válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Regex básica para validação de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata um número de telefone para o formato internacional
 * Garante que o número comece com o código do país (55 para Brasil)
 * @param phoneNumber Número de telefone a ser formatado
 * @returns Número formatado ou null se inválido
 */
export function formatPhoneNumber(phoneNumber: string): string | null {
  if (!phoneNumber) return null;
  
  // Remove todos os caracteres não numéricos
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Se não tiver pelo menos 10 dígitos, é inválido
  if (cleanNumber.length < 10) return null;
  
  // Se já começar com 55, retorna como está
  if (cleanNumber.startsWith('55')) {
    return cleanNumber;
  }
  
  // Caso contrário, adiciona o 55 (Brasil)
  return `55${cleanNumber}`;
}
