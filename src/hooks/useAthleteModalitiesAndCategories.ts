import { useQuery } from '@tanstack/react-query'

interface Modality {
  id: string
  name: string
}

interface Category {
  id: string
  originalId?: string // ID original da tabela EventCategory
  name: string
  modality: string
  modalityName?: string
}

interface Gender {
  id: string
  name: string
}

interface Mappings {
  modalities: Record<string, string>
  categories: Record<string, string>
  genders: Record<string, string>
}

interface ModalitiesAndCategoriesResponse {
  modalities: Modality[]
  categories: Category[]
  genders?: Gender[]
  mappings?: Mappings
}

export function useAthleteModalitiesAndCategories() {
  return useQuery<ModalitiesAndCategoriesResponse>({
    queryKey: ['athlete-modalities-categories'],
    queryFn: async () => {
      try {
        // Buscar modalidades e categorias da API
        const response = await fetch('/api/modalities-categories')
        
        if (!response.ok) {
          console.error('Resposta não-ok da API:', response.status)
          return { modalities: [], categories: [] }
        }
        
        return await response.json()
      } catch (error) {
        console.error('Erro ao buscar modalidades e categorias:', error)
        return { modalities: [], categories: [] }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
