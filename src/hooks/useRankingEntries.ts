import { useQuery } from '@tanstack/react-query'

interface RankingEntryFilters {
  modality: string
  category: string
  gender: 'MALE' | 'FEMALE'
  season?: number
  page?: number
  limit?: number
  enabled?: boolean
}

export interface RankingEntry {
  id: string
  athleteId: string
  modality: string
  category: string
  gender: 'MALE' | 'FEMALE'
  points: number
  position: number
  city: string
  team: string | null
  season: number
  createdAt: string
  updatedAt: string
  athlete: {
    id: string
    fullName: string
    image?: string | null
  }
}

interface PaginationData {
  total: number
  totalPages: number
  page: number
  limit: number
}

interface RankingEntriesResponse {
  data: RankingEntry[]
  pagination: PaginationData
}

export async function fetchRankingEntries(filters: RankingEntryFilters): Promise<RankingEntriesResponse> {
  const searchParams = new URLSearchParams()
  
  // Adicionar filtros à query string
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && key !== 'enabled') {
      if (key === 'page' || key === 'limit' || key === 'season') {
        searchParams.append(key, String(Number(value)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  console.log(`Buscando rankings com filtros: ${JSON.stringify(filters)}`)
  const response = await fetch(`/api/rankings?${searchParams.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    console.error('Erro na requisição:', error)
    throw new Error(error.error?.message || 'Erro ao buscar entradas de ranking')
  }

  const data = await response.json()
  console.log(`Rankings retornados: ${data.data.length}`)
  return data
}

export function useRankingEntries(filters: RankingEntryFilters) {
  const { enabled = true, ...queryFilters } = filters
  
  return useQuery<RankingEntriesResponse, Error>({
    queryKey: ['rankingEntries', queryFilters],
    queryFn: () => fetchRankingEntries(queryFilters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: true, // Atualizar ao voltar à janela
    refetchOnMount: true, // Atualizar quando o componente é montado
    enabled: enabled && !!queryFilters.modality && !!queryFilters.category && !!queryFilters.gender
  })
}
