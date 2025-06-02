import { useState, useEffect, useCallback } from 'react'
import { useDebug } from './useDebug'

interface EventFilters {
  modalityId?: string
  categoryId?: string
  gender?: string
  status?: 'all' | 'published' | 'draft'
  isFree?: boolean
  search?: string
  page?: number
  limit?: number
}

interface UseEventsListOptions {
  status?: 'all' | 'published' | 'draft'
  initialFilters?: EventFilters
}

export function useEventsList(options: UseEventsListOptions = {}) {
  // Inicializa o debug fora do render para evitar dependências circulares
  const debug = useDebug('useEventsList')
  
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 10,
    status: options.status || 'all',
    ...options.initialFilters
  })

  // Função para buscar eventos - memorizada com useCallback para evitar recriação
  // Não incluímos debug nas dependências para evitar o loop infinito
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Constrói a query string com os filtros
      const queryParams = new URLSearchParams()
      
      if (filters.modalityId && filters.modalityId !== 'all') {
        queryParams.set('modalityId', filters.modalityId)
      }
      if (filters.categoryId && filters.categoryId !== 'all') {
        queryParams.set('categoryId', filters.categoryId)
      }
      if (filters.gender && filters.gender !== 'all') {
        queryParams.set('gender', filters.gender)
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.set('status', filters.status)
      }
      if (typeof filters.isFree === 'boolean') {
        queryParams.set('isFree', filters.isFree.toString())
      }
      if (filters.search) {
        queryParams.set('search', filters.search)
      }
      if (filters.page) {
        queryParams.set('page', filters.page.toString())
      }
      if (filters.limit) {
        queryParams.set('limit', filters.limit.toString())
      }

      // Faz a requisição para a API
      const response = await fetch(`/api/events?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar eventos')
      }

      const data = await response.json()
      // Usamos debug, mas não o incluímos como dependência
      debug.log('Eventos carregados:', data)
      setEvents(data)
    } catch (err) {
      // Usamos debug, mas não o incluímos como dependência
      debug.error('Erro ao carregar eventos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos')
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]) // Apenas filters como dependência, não debug

  // Efeito para buscar eventos quando os filtros mudam
  useEffect(() => {
    // Usamos debug, mas não o incluímos como dependência
    debug.log('Filtros atualizados, buscando eventos:', filters)
    fetchEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEvents]) // Use apenas fetchEvents como dependência

  // Função para atualizar filtros - usando callback para maior estabilidade
  const updateFilters = useCallback((newFilters: Partial<EventFilters>) => {
    // Usamos debug, mas não o incluímos como dependência
    debug.log('Atualizando filtros:', newFilters)
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Volta para a primeira página quando os filtros mudam
      page: newFilters.page || 1
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Sem dependências, função estável

  return {
    events,
    isLoading,
    error,
    filters,
    setFilters: updateFilters,
    refresh: fetchEvents
  }
}
