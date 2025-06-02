import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata o tamanho do arquivo para uma string legível
 * @param bytes Tamanho em bytes
 * @returns String formatada (ex: "1,5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  // Formata o número com vírgula para decimal (padrão brasileiro)
  return `${size.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${units[unitIndex]}`
}

/**
 * Gera um número de protocolo único para inscrições
 * Formato: REG-AAAAMMDD-XXXXX (onde X são caracteres aleatórios)
 */
export function generateProtocol(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  
  return `REG-${year}${month}${day}-${random}`
}

/**
 * Formata um número como moeda brasileira (BRL)
 * @param value Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) {
    return "R$ 0,00"; // Ou outra representação para inválido
  }
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}
