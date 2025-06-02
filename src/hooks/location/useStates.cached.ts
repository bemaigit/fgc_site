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

// Chave para armazenar no localStorage
const STATES_CACHE_KEY = 'fgc-states-cache';
// Tempo de expiração do cache (7 dias em milissegundos)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

interface CacheData {
  timestamp: number;
  data: State[];
}

export function useStates() {
  const { toast } = useToast();
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((cache: CacheData): boolean => {
    const now = Date.now();
    return now - cache.timestamp < CACHE_EXPIRATION;
  }, []);

  // Função para salvar dados no cache
  const saveToCache = useCallback((data: State[]) => {
    try {
      const cacheData: CacheData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(STATES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao salvar estados no cache:', error);
    }
  }, []);

  // Função para obter dados do cache
  const getFromCache = useCallback((): State[] | null => {
    try {
      const cachedData = localStorage.getItem(STATES_CACHE_KEY);
      if (!cachedData) return null;

      const parsedCache: CacheData = JSON.parse(cachedData);
      
      if (!isCacheValid(parsedCache)) {
        localStorage.removeItem(STATES_CACHE_KEY);
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.warn('Erro ao ler estados do cache:', error);
      localStorage.removeItem(STATES_CACHE_KEY);
      return null;
    }
  }, [isCacheValid]);

  const fetchStates = useCallback(async (ignoreCache = false) => {
    // Verificar cache primeiro, se não estiver ignorando o cache
    if (!ignoreCache) {
      const cachedStates = getFromCache();
      if (cachedStates && cachedStates.length > 0) {
        setStates(cachedStates);
        setIsLoading(false);
        setError(null);
        setCacheHit(true);
        return;
      }
    }

    try {
      setIsLoading(true);
      setCacheHit(false);
      
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
      
      // Salvar no cache
      saveToCache(formattedStates);
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
  }, [toast, getFromCache, saveToCache]);

  // Limpar o cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STATES_CACHE_KEY);
      return true;
    } catch (error) {
      console.warn('Erro ao limpar cache de estados:', error);
      return false;
    }
  }, []);

  // Forçar atualização do cache
  const refreshCache = useCallback(() => {
    clearCache();
    fetchStates(true);
  }, [clearCache, fetchStates]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return {
    states,
    isLoading,
    error,
    cacheHit,
    refetch: fetchStates,
    refreshCache,
    clearCache
  };
}
