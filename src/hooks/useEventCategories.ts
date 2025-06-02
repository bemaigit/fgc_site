import useSWR from 'swr'
import { useDebug } from './useDebug'

export interface EventCategory {
  id: string
  name: string
  description?: string | null
  modalityIds: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Falha ao carregar categorias')
  return r.json()
})

export function useEventCategories(modalityId?: string, activeOnly: boolean = false) {
  const debug = useDebug('useEventCategories')
  
  // Construir a URL com os parâmetros de consulta
  let url = '/api/events/categories'
  const params = new URLSearchParams()
  
  if (modalityId) {
    params.set('modalityId', modalityId)
  }
  
  if (activeOnly) {
    params.set('active', 'true')
  }
  
  const queryString = params.toString()
  const fullUrl = queryString ? `${url}?${queryString}` : null
  
  // Usar SWR para buscar dados apenas quando temos uma URL válida
  const { data: categoriesResponse, error, isLoading } = useSWR(
    fullUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 segundos
      // Não buscar dados se não tivermos modalityId e isso for necessário
      shouldRetryOnError: false
    }
  )
  
  // Extrair os dados da resposta, lidando com diferentes formatos
  const data = categoriesResponse ? (
    Array.isArray(categoriesResponse) 
      ? categoriesResponse 
      : (categoriesResponse.data || [])
  ) : []
  
  // Log para debug
  if (data) {
    debug.log('Categorias carregadas:', data)
  }
  
  if (error) {
    debug.error('Erro ao carregar categorias:', error)
  }
  
  return {
    data,
    isLoading,
    error: error?.message || null
  }
}
