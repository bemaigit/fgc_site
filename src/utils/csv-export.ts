/**
 * Função para converter dados para formato CSV
 * @param data Array de objetos para converter em CSV
 * @param headers Objeto com mapeamento coluna -> título para o cabeçalho
 * @param filename Nome do arquivo a ser baixado
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: Record<keyof T, string>,
  filename: string
): void {
  // Criar cabeçalho
  const headerRow = Object.values(headers).join(',');
  
  // Criar linhas de dados
  const rows = data.map(item => {
    return Object.keys(headers)
      .map(key => {
        // Processar o valor para garantir que seja formatado corretamente para CSV
        const value = item[key as keyof T];
        // Tratar campos nulos ou undefined
        if (value === null || value === undefined) {
          return '';
        }
        // Se for string, escapar aspas e envolver em aspas
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        // Se for data, formatar
        if (value instanceof Date) {
          return `"${value.toLocaleDateString('pt-BR')} ${value.toLocaleTimeString('pt-BR')}"`;
        }
        // Outros tipos
        return String(value);
      })
      .join(',');
  });
  
  // Combinar cabeçalho e linhas
  const csv = [headerRow, ...rows].join('\n');
  
  // Criar Blob e download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
