import { useQuery } from '@tanstack/react-query'

interface RankingConfigurationFilters {
  modalityId?: string
  categoryId?: string
  gender?: 'MALE' | 'FEMALE'
  season?: number
}

export interface RankingConfiguration {
  id: string
  name: string
  modalityId: string
  categoryId: string
  gender: 'MALE' | 'FEMALE'
  season: number
  createdAt: string
  updatedAt: string
  modalityName: string
  categoryName: string
  championName?: string
}

export interface RankingConfigurationsResponse {
  configurations: RankingConfiguration[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function fetchRankingConfigurations(filters: RankingConfigurationFilters = {}): Promise<RankingConfigurationsResponse> {
  const searchParams = new URLSearchParams()
  
  // Adicionar filtros à query string
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'season') {
        searchParams.append(key, String(Number(value)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/ranking-configurations?${searchParams.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    console.error('Erro na requisição:', error)
    throw new Error(error.error?.message || 'Erro ao buscar configurações de ranking')
  }

  return response.json()
}

export function useRankingConfigurations(filters: RankingConfigurationFilters = {}) {
  return useQuery<RankingConfigurationsResponse, Error>({
    queryKey: ['rankingConfigurations', filters],
    queryFn: () => fetchRankingConfigurations(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: true, // Alterado para true para atualizar ao voltar à janela
    refetchOnMount: true // Adicionado para atualizar quando o componente é montado
  })
}
