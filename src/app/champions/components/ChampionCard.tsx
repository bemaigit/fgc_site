'use client'

import Image from 'next/image'

interface ChampionCardProps {
  position: number
  athleteName: string
  athleteImage: string | null
  city: string
  team: string | null
}

export function ChampionCard({
  position,
  athleteName,
  athleteImage,
  city,
  team
}: ChampionCardProps) {
  return (
    <div className="flex items-center gap-6 p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-sm">
      {/* Posição */}
      <div className="w-16 text-center">
        <span className="text-4xl font-bold text-white">{position}</span>
      </div>

      {/* Informações do Atleta */}
      <div className="flex-1">
        <div className="flex items-center gap-4">
          {/* Avatar do atleta (se disponível) */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-green-600/50 flex-shrink-0">
            {athleteImage ? (
              <Image
                src={athleteImage}
                alt={athleteName}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {athleteName.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Nome e Equipe */}
          <div>
            <h3 className="text-xl font-bold text-white">
              {athleteName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-white/60">
                {team || 'Sem equipe'}
              </span>
              <span className="text-sm text-white/60">•</span>
              <span className="text-sm text-white/60">
                {city}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
