import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChampionFilters {
  modality: string
  category: string
  year: number
}

export interface ChampionFiltersStore {
  male: ChampionFilters
  female: ChampionFilters
  updateMaleFilters: (filters: Partial<ChampionFilters>) => void
  updateFemaleFilters: (filters: Partial<ChampionFilters>) => void
  resetFilters: () => void
}

// Valores padrão iniciais
const defaultFilters = {
  modality: '',
  category: '',
  year: new Date().getFullYear()
}

// Valores iniciais padrão
const initialState = {
  male: { ...defaultFilters },
  female: { ...defaultFilters }
}

// Cria o store com persist, mas apenas no lado do cliente
export const useChampionFilters = create<ChampionFiltersStore>(
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
          name: 'champion-filters',
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
