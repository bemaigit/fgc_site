export interface RankingFilters {
  modality: string
  category: string
  season: number
  page?: number
}

import type { RankingEntry } from '@/hooks/useRankingEntries'

interface PaginationData {
  total: number
  totalPages: number
  page: number
  limit: number
}

export interface RankingResponse {
  data: RankingEntry[]
  pagination: PaginationData
}
