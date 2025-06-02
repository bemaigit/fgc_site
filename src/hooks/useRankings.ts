import { useQuery } from '@tanstack/react-query'

interface RankingFilters {
  gender: 'MALE' | 'FEMALE'
  modality: string
  category: string
  season: number
  page?: number
  limit?: number
}

interface RankingData {
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
  updatedAt: string
  athlete: {
    id: string
    fullName: string
    image: string | null
  }
}

interface PaginationData {
  total: number
  totalPages: number
  page: number
  limit: number
}

interface RankingResponse {
  data: RankingData[]
  pagination: PaginationData
}

interface RankingError {
  error: string
  details: {
    message: string
    receivedParams: Record<string, string>
    error: string
    stack?: string
  }
}

export async function fetchRankings(filters: RankingFilters): Promise<RankingResponse> {
  const searchParams = new URLSearchParams()
  
  // Garantir que os valores numéricos são convertidos para string
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'season' || key === 'page' || key === 'limit') {
        searchParams.append(key, String(Number(value)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/rankings?${searchParams.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    console.error('Erro na requisição:', error)
    throw new Error(error.error?.message || 'Erro ao buscar rankings')
  }

  return response.json()
}

export function useRankings(filters: RankingFilters) {
  return useQuery({
    queryKey: ['rankings', filters],
    queryFn: () => fetchRankings(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
    refetchOnWindowFocus: false
  })
}
