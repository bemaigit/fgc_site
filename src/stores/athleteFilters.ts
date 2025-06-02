import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Interface para os filtros de atletas
interface AthleteFilters {
  gender: 'MALE' | 'FEMALE' | 'ALL'
  modality: string
  category: string
  search: string
}

// Interface para o store de filtros
export interface AthleteFiltersStore {
  filters: AthleteFilters
  updateFilters: (newFilters: Partial<AthleteFilters>) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: AthleteFilters = {
  gender: 'ALL',
  modality: '',
  category: '',
  search: ''
}

// Criar o store persistido
export const useAthleteFilters = create<AthleteFiltersStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      
      // Atualizar filtros parcialmente
      updateFilters: (newFilters) => 
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
      
      // Resetar filtros para o estado inicial
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'athlete-filters', // nome para o armazenamento
    }
  )
)
