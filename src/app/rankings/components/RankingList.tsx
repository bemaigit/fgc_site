'use client'

import { RankingEntry } from '@/hooks/useRankingEntries'
import { RankingCard } from './RankingCard'

interface PaginationData {
  total: number
  totalPages: number
  page: number
  limit: number
}

interface RankingListProps {
  entries: RankingEntry[]
  pagination: PaginationData
  onPageChange?: (page: number) => void
}

export function RankingList({ entries, pagination, onPageChange }: RankingListProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center p-8 text-white/80">
        Nenhum atleta encontrado neste ranking.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <RankingCard
          key={entry.id}
          position={entry.position}
          athleteName={entry.athlete.fullName}
          athleteImage={entry.athlete.image || null}
          city={entry.city}
          team={entry.team}
          points={entry.points}
          athleteId={entry.athleteId || entry.athlete.id} // Usamos athleteId do ranking ou do atleta
        />
      ))}

      {pagination.totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`w-8 h-8 rounded-full ${
                pagination.page === i + 1
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
