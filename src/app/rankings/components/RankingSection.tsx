'use client'

import { useState, useEffect } from 'react'
import { useRankingFilters } from '@/stores/rankingFilters'
import { useRankingEntries } from '@/hooks/useRankingEntries'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RankingFilters } from './RankingFilters'
import { RankingList } from './RankingList'
import { Loader2 } from 'lucide-react'

export function RankingSection() {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male')
  
  const maleFilters = useRankingFilters((state) => state.male)
  const femaleFilters = useRankingFilters((state) => state.female)
  const updateMaleFilters = useRankingFilters((state) => state.updateMaleFilters)
  const updateFemaleFilters = useRankingFilters((state) => state.updateFemaleFilters)
  
  const filters = activeTab === 'male' ? maleFilters : femaleFilters
  const updateFilters = activeTab === 'male' ? updateMaleFilters : updateFemaleFilters

  // Buscar entradas de ranking
  const { 
    data: entriesData, 
    isLoading: isLoadingEntries, 
    error: entriesError
  } = useRankingEntries({
    modality: filters.modality,
    category: filters.category,
    gender: activeTab === 'male' ? 'MALE' : 'FEMALE',
    season: filters.season,
    page: currentPage,
    enabled: !!filters.modality && !!filters.category
  })

  // Log para debug das entradas
  useEffect(() => {
    console.log('Dados do ranking:', entriesData)
    if (entriesError) {
      console.error('Erro ao carregar ranking:', entriesError)
    }
  }, [entriesData, entriesError])

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'male' | 'female')
    setCurrentPage(1) // Resetar a página ao mudar de aba
    
    // Garantir que os filtros de temporada sejam mantidos entre as abas
    const currentSeason = filters.season
    if (value === 'male' && femaleFilters.season !== currentSeason) {
      updateMaleFilters({ season: currentSeason })
    } else if (value === 'female' && maleFilters.season !== currentSeason) {
      updateFemaleFilters({ season: currentSeason })
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderContent = () => {
    if (isLoadingEntries) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="ml-2 text-white/80">
            Carregando ranking...
          </span>
        </div>
      )
    }

    if (entriesError) {
      return (
        <div className="text-center p-8 text-white/80">
          Erro ao carregar dados do ranking. Por favor, tente novamente.
        </div>
      )
    }

    if (!entriesData || entriesData.data.length === 0) {
      return (
        <div className="text-center p-8 text-white/80">
          Nenhum ranking encontrado para os filtros selecionados.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <RankingList
          entries={entriesData.data}
          pagination={entriesData.pagination}
          onPageChange={handlePageChange}
        />
      </div>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-[#0077c8] to-[#004c8c] w-full flex flex-col items-center">
      <div className="w-full max-w-4xl px-4">
        <h2 className="text-3xl font-bold text-white mb-8">
          Rankings FGC
        </h2>

        <Tabs 
          defaultValue="male" 
          value={activeTab} 
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="male" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              Masculino
            </TabsTrigger>
            <TabsTrigger value="female" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
              Feminino
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <RankingFilters
              filters={filters}
              onUpdateFilters={updateFilters}
              gender={activeTab === 'male' ? 'MALE' : 'FEMALE'}
            />
            {renderContent()}
          </div>
        </Tabs>
      </div>
    </section>
  )
}
