'use client'

import { ChampionCard } from '@/app/champions/components/ChampionCard'
import { Champion } from './ChampionsSection'

interface ChampionsListProps {
  champions: Champion[]
}

export function ChampionsList({ champions }: ChampionsListProps) {
  if (!champions || champions.length === 0) {
    return (
      <div className="text-center p-8 text-white/80">
        Nenhum campeão encontrado para os filtros selecionados.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {champions.map((champion) => (
        <ChampionCard
          key={champion.id}
          position={champion.position}
          athleteName={champion.athleteName || (champion.athlete?.fullName)}
          athleteImage={champion.athleteImage || champion.athlete?.image}
          city={champion.city}
          team={champion.team}
        />
      ))}
    </div>
  )
}
