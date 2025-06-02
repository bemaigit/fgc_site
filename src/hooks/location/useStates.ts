import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface State {
  id: string;
  name: string;
  code: string;
}

interface IBGEState {
  id: number;
  nome: string;
  sigla: string;
}

export function useStates() {
  const { toast } = useToast();
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const data: IBGEState[] = await response.json();

      const formattedStates = data
        .map((state) => ({
          id: state.id.toString(),
          name: state.nome,
          code: state.sigla,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setStates(formattedStates);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar estados:', err);
      setError('Não foi possível carregar a lista de estados');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de estados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return {
    states,
    isLoading,
    error,
    refetch: fetchStates,
  };
}
