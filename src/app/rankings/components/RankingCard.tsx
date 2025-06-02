'use client'

import Image from 'next/image'
import Link from 'next/link'

interface RankingCardProps {
  position: number
  athleteName: string
  athleteImage: string | null
  city: string
  team: string | null
  points: number
  athleteId: string // ID do atleta para link do perfil
}

export function RankingCard({
  position,
  athleteName,
  athleteImage,
  city,
  team,
  points,
  athleteId
}: RankingCardProps) {
  return (
    <Link 
      href={`/atletas/${athleteId}`}
      className="flex items-center p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-sm"
    >
      {/* Posição */}
      <div className="w-10 sm:w-16 text-center flex-shrink-0">
        <span className="text-3xl sm:text-4xl font-bold text-white">{position}</span>
      </div>

      {/* Informações do Atleta */}
      <div className="flex-1 mx-2 sm:mx-4">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Avatar do atleta (se disponível) */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
            <Image
              src={!athleteImage ? '/images/placeholder-athlete.jpg' : 
                    athleteImage.startsWith('http') ? athleteImage : 
                    `/api/proxy?url=${encodeURIComponent(athleteImage)}`}
              alt={athleteName}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              onError={(e) => {
                // Não precisamos do console.error - vamos apenas trocar a imagem silenciosamente
                e.currentTarget.src = '/images/placeholder-athlete.jpg'
              }}
            />
          </div>
          
          {/* Nome e Equipe */}
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-white truncate">
              {athleteName}
            </h3>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <span className="text-xs sm:text-sm text-white/60 truncate">
                {team || 'Sem equipe'}
              </span>
              <span className="text-xs sm:text-sm text-white/60">•</span>
              <span className="text-xs sm:text-sm text-white/60 truncate">
                {city}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pontuação */}
      <div className="text-right w-16 sm:w-24 flex-shrink-0">
        <div className="text-xl sm:text-2xl font-bold text-white">
          {points}
        </div>
        <div className="text-xs sm:text-sm text-white/60">
          PONTOS
        </div>
      </div>
    </Link>
  )
}
