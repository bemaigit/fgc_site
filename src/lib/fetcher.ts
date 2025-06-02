/**
 * Função auxiliar para fazer requisições fetch com tratamento de erros
 * Fornece mensagens detalhadas para facilitar o diagnóstico de problemas
 */
export const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Tentar extrair informações detalhadas de erro da resposta
      try {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || 'Erro desconhecido';
        throw new Error(`${response.status} ${response.statusText}: ${errorMessage}`);
      } catch (parseError) {
        // Se não for possível extrair JSON, usar informações básicas do status
        throw new Error(`Erro ao buscar dados (${response.status} ${response.statusText})`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error(`Erro ao buscar ${url}:`, error);
    // Re-lançar o erro para ser tratado pelo chamador
    throw error;
  }
};
