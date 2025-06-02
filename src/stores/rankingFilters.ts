import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RankingFilters {
  modality: string  // ID da modalidade
  category: string  // ID da categoria
  season: number
  page: number
}

interface RankingFiltersStore {
  male: RankingFilters
  female: RankingFilters
  updateMaleFilters: (filters: Partial<RankingFilters>) => void
  updateFemaleFilters: (filters: Partial<RankingFilters>) => void
  resetFilters: () => void
}

// Valores padrão temporários - serão substituídos pelos IDs reais das modalidades/categorias
// quando os dados forem carregados da API
const defaultFilters = {
  modality: '',  // Será preenchido com o ID da primeira modalidade disponível
  category: '',  // Será preenchido com o ID da primeira categoria disponível
  season: new Date().getFullYear(),
  page: 1
}

// Valores iniciais padrão
const initialState = {
  male: { ...defaultFilters },
  female: { ...defaultFilters }
}

// Cria o store com persist, mas apenas no lado do cliente
export const useRankingFilters = create<RankingFiltersStore>(
  (typeof window !== 'undefined') 
    ? persist(
        (set) => ({
          male: initialState.male,
          female: initialState.female,
          
          updateMaleFilters: (filters) => 
            set((state) => ({
              male: { ...state.male, ...filters }
            })),
            
          updateFemaleFilters: (filters) =>
            set((state) => ({
              female: { ...state.female, ...filters }
            })),
            
          resetFilters: () =>
            set(() => ({
              male: { ...defaultFilters },
              female: { ...defaultFilters }
            }))
        }),
        {
          name: 'ranking-filters',
          partialize: (state) => ({ male: state.male, female: state.female }),
        }
      )
    : (set) => ({
        male: initialState.male,
        female: initialState.female,
        
        updateMaleFilters: (filters) => 
          set((state) => ({
            male: { ...state.male, ...filters }
          })),
          
        updateFemaleFilters: (filters) =>
          set((state) => ({
            female: { ...state.female, ...filters }
          })),
          
        resetFilters: () =>
          set(() => ({
            male: { ...defaultFilters },
            female: { ...defaultFilters }
          }))
      })
)
