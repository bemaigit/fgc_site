/**
 * Gera um protocolo único para inscrições no formato EVE-YYYYMMDD-XXXXX
 * onde XXXXX é um número aleatório entre 1000 e 9999
 * 
 * Esta função foi atualizada para usar um prefixo consistente EVE- em todo o sistema,
 * garantindo compatibilidade com todas as partes do fluxo de inscrição e pagamento.
 */
export function generateProtocol(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000) + 1000 // Número entre 1000 e 9999

  return `EVE-${year}${month}${day}-${random}`
}
