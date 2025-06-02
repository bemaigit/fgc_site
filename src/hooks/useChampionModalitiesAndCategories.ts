import { useQuery } from '@tanstack/react-query'

export interface ChampionModality {
  id: string
  name: string
  description: string | null
}

export interface ChampionCategory {
  id: string
  name: string
  modalityId: string
  modality?: string // Nome da modalidade (adicionado pela API)
  description: string | null
}

interface ChampionModalitiesAndCategoriesData {
  modalities: ChampionModality[]
  categories: ChampionCategory[]
}

export async function fetchChampionModalitiesAndCategories(): Promise<ChampionModalitiesAndCategoriesData> {
  const response = await fetch('/api/championships/modalities-and-categories')
  if (!response.ok) {
    throw new Error('Erro ao buscar modalidades e categorias de campeões')
  }
  return response.json()
}

export function useChampionModalitiesAndCategories() {
  return useQuery({
    queryKey: ['championModalitiesAndCategories'],
    queryFn: fetchChampionModalitiesAndCategories,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false
  })
}
