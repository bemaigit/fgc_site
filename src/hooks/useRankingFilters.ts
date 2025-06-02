import { create } from 'zustand'
import { useQuery } from '@tanstack/react-query'

interface FilterOption {
  value: string
  label: string
}

interface RankingFiltersData {
  modalities: FilterOption[]
  categories: FilterOption[]
}

interface RankingFilter {
  modality: string
  category: string
  season: number
  page: number
}

interface RankingFiltersStore {
  male: RankingFilter
  female: RankingFilter
  updateMaleFilters: (filters: Partial<RankingFilter>) => void
  updateFemaleFilters: (filters: Partial<RankingFilter>) => void
}

const currentYear = new Date().getFullYear()

export const useRankingFilters = create<RankingFiltersStore>((set) => ({
  male: {
    modality: 'ROAD',
    category: 'ELITE',
    season: currentYear,
    page: 1
  },
  female: {
    modality: 'ROAD',
    category: 'ELITE',
    season: currentYear,
    page: 1
  },
  updateMaleFilters: (newFilters) =>
    set((state) => ({
      male: { ...state.male, ...newFilters }
    })),
  updateFemaleFilters: (newFilters) =>
    set((state) => ({
      female: { ...state.female, ...newFilters }
    }))
}))

async function fetchRankingFilters(): Promise<RankingFiltersData> {
  const response = await fetch('/api/rankings/filters')
  if (!response.ok) {
    throw new Error('Erro ao buscar opções de filtro')
  }
  return response.json()
}

export function useRankingFiltersOptions() {
  return useQuery({
    queryKey: ['rankingFilters'],
    queryFn: fetchRankingFilters,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false
  })
}
