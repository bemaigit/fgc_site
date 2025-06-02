'use client'

import { useRankings } from '@/hooks/useRankings'
import { useRankingFilters } from '@/stores/rankingFilters'
import { RankingFilters } from '../components/RankingFilters'
import { RankingList } from '../components/RankingList'
import { Loader2 } from 'lucide-react'
import { use } from 'react'
import type { RankingFilters as IRankingFilters, RankingResponse } from '@/types/ranking'

interface RankingPageProps {
  params: Promise<{
    gender: 'MALE' | 'FEMALE'
  }>
}

export default function RankingPage({ params }: RankingPageProps) {
  const { gender } = use(params)
  
  const filters = useRankingFilters(
    (state) => gender === 'MALE' ? state.male : state.female
  )
  const updateFilters = useRankingFilters(
    (state) => gender === 'MALE' ? state.updateMaleFilters : state.updateFemaleFilters
  )

  const { data, isLoading, error } = useRankings({
    gender,
    ...filters,
    limit: 15 // 15 atletas por página
  })

  const handlePageChange = (page: number) => {
    updateFilters({ page })
  }

  const title = gender === 'MALE' ? 'MASCULINO' : 'FEMININO'

  return (
    <main className="min-h-screen bg-[#0077c8]">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">RANKING {title}</h1>
          <p className="text-white/80 mt-2">
            Lista completa dos atletas ranqueados
          </p>
        </div>

        <div className="bg-white/10 rounded-sm overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="bg-[#0077c8] p-4 rounded-sm">
              <RankingFilters
                filters={filters}
                onUpdateFilters={(newFilters: Partial<IRankingFilters>) => {
                  updateFilters({ ...newFilters, page: 1 })
                }}
                gender={gender}
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-sm text-white/80">
                  Carregando rankings...
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-100 p-4 rounded-sm">
                <p className="font-medium">Erro ao carregar rankings</p>
                <p className="text-sm mt-1">Por favor, tente novamente.</p>
              </div>
            )}

            {!isLoading && !error && (!data?.data || data.data.length === 0) && (
              <div className="bg-white/5 text-white/80 p-4 rounded-sm">
                <p className="font-medium">Nenhum ranking encontrado</p>
                <p className="text-sm mt-1">Não existem rankings para os filtros selecionados.</p>
              </div>
            )}

            {!isLoading && !error && data?.data && data.data.length > 0 && (
              <RankingList
                entries={data.data}
                pagination={data.pagination}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>

        <div className="text-white/60 text-sm mt-8 text-center">
          Última atualização: {new Date().toLocaleDateString()}
        </div>
      </div>
    </main>
  )
}
