/**
 * Converte uma string em um slug amigável para URL
 * @param str String a ser convertida
 * @returns String no formato de slug (apenas letras minúsculas, números e hífens)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase() // Converter para minúsculas
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
    .replace(/[\s_]+/g, '-') // Substituir espaços e underscores por hífen
    .replace(/^-+|-+$/g, '') // Remover hífens do início e fim
}
