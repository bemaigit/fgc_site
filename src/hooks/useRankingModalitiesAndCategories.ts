import { useQuery } from '@tanstack/react-query'

export interface RankingModality {
  name: string
  description: string | null
  active: boolean
}

export interface RankingCategory {
  id: string
  name: string
  modality: string
  description: string | null
  active: boolean
}

interface RankingModalitiesAndCategoriesData {
  modalities: RankingModality[]
  categories: RankingCategory[]
}

export async function fetchRankingModalitiesAndCategories(): Promise<RankingModalitiesAndCategoriesData> {
  const response = await fetch('/api/rankings/modalities-and-categories')
  if (!response.ok) {
    throw new Error('Erro ao buscar modalidades e categorias de ranking')
  }
  return response.json()
}

export function useRankingModalitiesAndCategories() {
  return useQuery({
    queryKey: ['rankingModalitiesAndCategories'],
    queryFn: fetchRankingModalitiesAndCategories,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false
  })
}
