'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Champion {
  id: string
  athleteId: string
  modality: string
  category: string
  gender: string
  position: number
  city: string
  team: string | null
  year: number
  createdAt: string
  athlete: {
    id: string
    fullName: string
    image?: string | null
  }
}

interface ChampionsTableProps {
  champions: Champion[]
  limit?: number
}

export function ChampionsTable({ champions, limit }: ChampionsTableProps) {
  // Aplicar limite se especificado
  const displayedChampions = limit ? champions.slice(0, limit) : champions;
  
  return (
    <div className="overflow-hidden">
      {displayedChampions.map((champion) => (
        <div 
          key={champion.id} 
          className="flex items-center gap-4 p-4 border-b border-blue-600/30 hover:bg-blue-600/30 transition-colors"
        >
          {/* Posição */}
          <div className="text-3xl font-bold text-white w-10 text-center">
            {champion.position}
          </div>
          
          {/* Informações do Atleta */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10 bg-blue-100">
              {champion.athlete.image ? (
                <AvatarImage src={champion.athlete.image} alt={champion.athlete.fullName} />
              ) : (
                <AvatarFallback>{champion.athlete.fullName.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-bold text-white text-lg">
                {champion.athlete.fullName}
              </h3>
              <div className="text-xs text-white/70">
                {champion.team || 'Sem equipe'} • {champion.city}
              </div>
            </div>
          </div>
          
          {/* Ano */}
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {champion.year}
            </div>
            <div className="text-xs text-white/70">
              ANO
            </div>
          </div>
        </div>
      ))}
      
      {limit && champions.length > limit && (
        <div className="p-4 text-center">
          <button 
            className="text-white underline hover:text-blue-200 text-sm"
            onClick={() => window.location.href = '/campeoes'}
          >
            Ver todos os campeões
          </button>
        </div>
      )}
    </div>
  )
}
