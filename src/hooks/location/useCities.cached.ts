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

// Prefixo para chaves de cache de cidades (será concatenado com o ID do estado)
const CITIES_CACHE_PREFIX = 'fgc-cities-cache-';
// Tempo de expiração do cache (7 dias em milissegundos)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

interface CacheData {
  timestamp: number;
  data: City[];
}

export function useCities(stateId: string | null) {
  const { toast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Função para obter a chave de cache para um estado específico
  const getCacheKey = useCallback((stateId: string) => `${CITIES_CACHE_PREFIX}${stateId}`, []);

  // Função para verificar se o cache é válido
  const isCacheValid = useCallback((cache: CacheData): boolean => {
    const now = Date.now();
    return now - cache.timestamp < CACHE_EXPIRATION;
  }, []);

  // Função para salvar dados no cache
  const saveToCache = useCallback((stateId: string, data: City[]) => {
    try {
      const cacheData: CacheData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(getCacheKey(stateId), JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Erro ao salvar cidades do estado ${stateId} no cache:`, error);
    }
  }, [getCacheKey]);

  // Função para obter dados do cache
  const getFromCache = useCallback((stateId: string): City[] | null => {
    try {
      const cachedData = localStorage.getItem(getCacheKey(stateId));
      if (!cachedData) return null;

      const parsedCache: CacheData = JSON.parse(cachedData);
      
      if (!isCacheValid(parsedCache)) {
        localStorage.removeItem(getCacheKey(stateId));
        return null;
      }

      return parsedCache.data;
    } catch (error) {
      console.warn(`Erro ao ler cidades do estado ${stateId} do cache:`, error);
      localStorage.removeItem(getCacheKey(stateId));
      return null;
    }
  }, [getCacheKey, isCacheValid]);

  const fetchCities = useCallback(async (stateId: string, ignoreCache = false) => {
    // Verificar cache primeiro, se não estiver ignorando o cache
    if (!ignoreCache) {
      const cachedCities = getFromCache(stateId);
      if (cachedCities && cachedCities.length > 0) {
        setCities(cachedCities);
        setIsLoading(false);
        setError(null);
        setCacheHit(true);
        return;
      }
    }

    try {
      setIsLoading(true);
      setCacheHit(false);
      
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
      
      // Salvar no cache
      saveToCache(stateId, formattedCities);
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
  }, [toast, getFromCache, saveToCache]);

  // Limpar o cache para um estado específico
  const clearCache = useCallback((stateId: string) => {
    try {
      localStorage.removeItem(getCacheKey(stateId));
      return true;
    } catch (error) {
      console.warn(`Erro ao limpar cache de cidades do estado ${stateId}:`, error);
      return false;
    }
  }, [getCacheKey]);

  // Limpar todo o cache de cidades
  const clearAllCache = useCallback(() => {
    try {
      // Encontrar todas as chaves que começam com o prefixo
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CITIES_CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      // Remover todas as chaves encontradas
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn('Erro ao limpar todo o cache de cidades:', error);
      return false;
    }
  }, []);

  // Forçar atualização do cache para um estado específico
  const refreshCache = useCallback((stateId: string) => {
    if (stateId) {
      clearCache(stateId);
      fetchCities(stateId, true);
    }
  }, [clearCache, fetchCities]);

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
    cacheHit,
    refetch: fetchCities,
    refreshCache,
    clearCache,
    clearAllCache
  };
}
