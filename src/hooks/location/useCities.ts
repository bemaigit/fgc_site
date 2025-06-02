import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface City {
  id: string;
  name: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

export function useCities(stateId: string | null) {
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async (stateId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`
      );
      const data: IBGECity[] = await response.json();

      const formattedCities = data
        .map((city) => ({
          id: city.id.toString(),
          name: city.nome,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCities(formattedCities);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar cidades:', err);
      setError('Não foi possível carregar a lista de cidades');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de cidades',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (stateId) {
      fetchCities(stateId);
    } else {
      setCities([]);
    }
  }, [stateId, fetchCities]);

  return {
    cities,
    isLoading,
    error,
    refetch: fetchCities,
  };
}
