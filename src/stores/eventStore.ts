import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Interface para dados específicos da aba de modalidades
interface EventModalitiesData {
  modalityIds: string[]
  categoryIds: string[]
  genderIds: string[]
}

// Interface para o estado da store
interface EventStoreState {
  // Dados das modalidades
  modalities: EventModalitiesData | null

  // Ações
  setModalities: (data: EventModalitiesData) => void
  getModalities: () => EventModalitiesData | null
  clearModalities: () => void
  
  // Reset completo
  reset: () => void
}

// Estado inicial
const initialState = {
  modalities: null
}

// Criação da store com persistência
export const createEventStore = () => {
  return useSingletonEventStore
}

// Utilizamos um singleton para garantir o compartilhamento do estado
const useSingletonEventStore = create<EventStoreState>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        // Métodos para manipular modalidades
        setModalities: (data) => {
          set({ modalities: data }, false, 'setModalities')
        },
        
        getModalities: () => {
          return get().modalities
        },
        
        clearModalities: () => {
          set({ modalities: null }, false, 'clearModalities')
        },

        // Reset completo da store
        reset: () => set(initialState, false, 'reset')
      }),
      { name: 'EventStore' }
    ),
    {
      name: 'event-store',
      partialize: (state) => ({
        modalities: state.modalities
      })
    }
  )
)
