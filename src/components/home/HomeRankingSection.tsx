'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRankingEntries, RankingEntry } from '@/hooks/useRankingEntries'
import { useRankingModalitiesAndCategories } from '@/hooks/useRankingModalitiesAndCategories'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useRankingFilters } from '@/stores/rankingFilters'

export function HomeRankingSection() {
  // Estados para controle de dropdowns
  const [showModalityDropdown, setShowModalityDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showFemaleModalityDropdown, setShowFemaleModalityDropdown] = useState(false)
  const [showFemaleCategoryDropdown, setShowFemaleCategoryDropdown] = useState(false)
  
  // Usar o store para os filtros
  const maleFilters = useRankingFilters((state) => state.male)
  const femaleFilters = useRankingFilters((state) => state.female)
  const updateMaleFilters = useRankingFilters((state) => state.updateMaleFilters)
  const updateFemaleFilters = useRankingFilters((state) => state.updateFemaleFilters)
  
  // Obter dados de modalidades e categorias
  const { data, isLoading: isLoadingOptions } = useRankingModalitiesAndCategories()
  
  // Obter dados do ranking masculino
  const { data: entriesData, isLoading: isLoadingEntries } = useRankingEntries({
    modality: maleFilters.modality,
    category: maleFilters.category,
    gender: 'MALE',
    season: maleFilters.season
  })
  
  // Obter dados do ranking feminino
  const { data: femaleEntriesData, isLoading: isLoadingFemaleEntries } = useRankingEntries({
    modality: femaleFilters.modality,
    category: femaleFilters.category,
    gender: 'FEMALE',
    season: femaleFilters.season
  })
  
  // Filtrar categorias baseado na modalidade selecionada para o painel masculino
  const filteredCategories = useMemo(() => {
    if (!data?.categories || !maleFilters.modality) return []
    
    return data.categories
      .filter(category => category.modality === maleFilters.modality)
      .map(category => ({
        id: category.id,
        name: category.name
      }))
  }, [data?.categories, maleFilters.modality])
  
  // Filtrar categorias baseado na modalidade selecionada para o painel feminino
  const filteredFemaleCategories = useMemo(() => {
    if (!data?.categories || !femaleFilters.modality) return []
    
    return data.categories
      .filter(category => category.modality === femaleFilters.modality)
      .map(category => ({
        id: category.id,
        name: category.name
      }))
  }, [data?.categories, femaleFilters.modality])
  
  // Inicializar modalidade e categoria quando os dados forem carregados
  useEffect(() => {
    if (data?.modalities && data.modalities.length > 0 && !maleFilters.modality) {
      updateMaleFilters({ modality: data.modalities[0].name })
    }
  }, [data?.modalities, maleFilters.modality, updateMaleFilters])
  
  useEffect(() => {
    if (data?.modalities && data.modalities.length > 0 && !femaleFilters.modality) {
      updateFemaleFilters({ modality: data.modalities[0].name })
    }
  }, [data?.modalities, femaleFilters.modality, updateFemaleFilters])
  
  // Resetar categoria quando a modalidade mudar
  useEffect(() => {
    if (filteredCategories.length > 0 && !maleFilters.category) {
      updateMaleFilters({ category: filteredCategories[0].name })
    } else if (filteredCategories.length === 0) {
      updateMaleFilters({ category: '' })
    }
  }, [filteredCategories, maleFilters.category, updateMaleFilters])
  
  useEffect(() => {
    if (filteredFemaleCategories.length > 0 && !femaleFilters.category) {
      updateFemaleFilters({ category: filteredFemaleCategories[0].name })
    } else if (filteredFemaleCategories.length === 0) {
      updateFemaleFilters({ category: '' })
    }
  }, [filteredFemaleCategories, femaleFilters.category, updateFemaleFilters])
  
  // Gerar anos para o seletor (5 anos mais recentes)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  
  // Renderiza um card de atleta no ranking
  const renderAthleteCard = (entry: RankingEntry) => (
    <Link 
      href={`/atletas/${entry.athlete.id}`} 
      key={entry.id} 
      className="flex items-center gap-4 p-4 border-b border-blue-600/30 hover:bg-blue-600/30 transition-colors"
    >
      {/* Posição */}
      <div className="text-3xl font-bold text-white w-10 text-center">
        {entry.position}
      </div>
      
      {/* Informações do Atleta */}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 bg-blue-600/50 rounded-full overflow-hidden flex-shrink-0">
          {entry.athlete.image ? (
            <img 
              src={`/api/athletes/image?path=${encodeURIComponent(entry.athlete.image)}`} 
              alt={entry.athlete.fullName} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = '/images/placeholder-athlete.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {entry.athlete.fullName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-white">
            {entry.athlete.fullName}
          </h3>
          <div className="text-xs text-white/70">
            {entry.team || 'Sem equipe'} • {entry.city}
          </div>
        </div>
      </div>
      
      {/* Pontuação */}
      <div className="text-right">
        <div className="text-xl font-bold text-white">
          {entry.points}
        </div>
        <div className="text-xs text-white/70">
          PONTOS
        </div>
      </div>
    </Link>
  )
  
  return (
    <section className="w-full bg-gradient-to-br from-[#0077c8] to-[#004c8c] py-12">
      <div className="container mx-auto px-4">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            RANKINGS GOIANO
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-2">
            Acompanhe o desempenho dos atletas nas diferentes modalidades e categorias
          </p>
        </div>
        
        {/* Filtros principais no topo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8">
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            SPEED
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            MTB
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            BMX
          </div>
        </div>
        
        {/* Grid de painéis de ranking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Painel Masculino */}
          <div>
            {/* Filtros para o painel masculino */}
            <div className="mb-4">
              {/* Container para todos os filtros na mesma linha */}
              <div className="flex flex-row space-x-1">
                {/* Filtro de Modalidade */}
                <div className="relative w-[32%]">
                  <button 
                    className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
                    onClick={() => {
                      setShowModalityDropdown(!showModalityDropdown)
                      setShowCategoryDropdown(false)
                    }}
                    disabled={isLoadingOptions}
                  >
                    {isLoadingOptions ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="truncate">Carregando...</span>
                      </span>
                    ) : (
                      <>
                        <span className="truncate">{maleFilters.modality || 'Modalidade'}</span>
                        <span>+</span>
                      </>
                    )}
                  </button>
                  
                  {showModalityDropdown && data?.modalities && data.modalities.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
                      {data.modalities.map(modality => (
                        <button
                          key={modality.name}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            updateMaleFilters({ modality: modality.name, category: '' })
                            setShowModalityDropdown(false)
                          }}
                        >
                          {modality.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Filtro de Categoria */}
                <div className="relative w-[32%]">
                  <button 
                    className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown)
                      setShowModalityDropdown(false)
                    }}
                    disabled={!maleFilters.modality || filteredCategories.length === 0}
                  >
                    {!maleFilters.modality ? (
                      <span className="truncate">Selecione modalidade</span>
                    ) : filteredCategories.length === 0 ? (
                      <span className="truncate">Sem categorias</span>
                    ) : (
                      <>
                        <span className="truncate">{maleFilters.category || 'Categoria'}</span>
                        <span>+</span>
                      </>
                    )}
                  </button>
                  
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
                      {filteredCategories.map(category => (
                        <button
                          key={`male-${category.id}-${category.name}`}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            updateMaleFilters({ category: category.name })
                            setShowCategoryDropdown(false)
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Filtro de Temporada */}
                <select
                  className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 border-0 rounded-none focus:ring-0 focus:outline-none w-[32%]"
                  value={maleFilters.season}
                  onChange={(e) => updateMaleFilters({ season: parseInt(e.target.value) })}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Painel Masculino */}
            <div className="bg-blue-700 rounded-sm overflow-hidden">
              <div className="bg-blue-600 py-3 px-4">
                <h3 className="text-white text-xl font-bold">HOMENS</h3>
              </div>
              
              {isLoadingEntries ? (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white/80">Carregando...</span>
                </div>
              ) : !entriesData?.data || entriesData.data.length === 0 ? (
                <div className="p-8 text-center text-white/80">
                  Nenhum ranking encontrado para os filtros selecionados.
                </div>
              ) : (
                <>
                  <div>
                    {entriesData.data.slice(0, 3).map((entry) => renderAthleteCard(entry))}
                  </div>
                  <Link 
                    href={`/rankings?modality=${maleFilters.modality}&category=${maleFilters.category}&gender=MALE&season=${maleFilters.season}`}
                    className="block bg-blue-800 text-white text-center py-3 hover:bg-blue-900 transition-colors"
                  >
                    TODAS AS CLASSIFICAÇÕES →
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Painel Feminino */}
          <div>
            {/* Filtros para o painel feminino */}
            <div className="mb-4">
              {/* Container para todos os filtros na mesma linha */}
              <div className="flex flex-row space-x-1">
                {/* Filtro de Modalidade */}
                <div className="relative w-[32%]">
                  <button 
                    className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
                    onClick={() => {
                      setShowFemaleModalityDropdown(!showFemaleModalityDropdown)
                      setShowFemaleCategoryDropdown(false)
                    }}
                    disabled={isLoadingOptions}
                  >
                    {isLoadingOptions ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="truncate">Carregando...</span>
                      </span>
                    ) : (
                      <>
                        <span className="truncate">{femaleFilters.modality || 'Modalidade'}</span>
                        <span>+</span>
                      </>
                    )}
                  </button>
                  
                  {showFemaleModalityDropdown && data?.modalities && data.modalities.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
                      {data.modalities.map(modality => (
                        <button
                          key={`female-${modality.name}`}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            updateFemaleFilters({ modality: modality.name, category: '' })
                            setShowFemaleModalityDropdown(false)
                          }}
                        >
                          {modality.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Filtro de Categoria */}
                <div className="relative w-[32%]">
                  <button 
                    className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
                    onClick={() => {
                      setShowFemaleCategoryDropdown(!showFemaleCategoryDropdown)
                      setShowFemaleModalityDropdown(false)
                    }}
                    disabled={!femaleFilters.modality || filteredFemaleCategories.length === 0}
                  >
                    {!femaleFilters.modality ? (
                      <span className="truncate">Selecione modalidade</span>
                    ) : filteredFemaleCategories.length === 0 ? (
                      <span className="truncate">Sem categorias</span>
                    ) : (
                      <>
                        <span className="truncate">{femaleFilters.category || 'Categoria'}</span>
                        <span>+</span>
                      </>
                    )}
                  </button>
                  
                  {showFemaleCategoryDropdown && filteredFemaleCategories.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
                      {filteredFemaleCategories.map(category => (
                        <button
                          key={`female-${category.id}-${category.name}`}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            updateFemaleFilters({ category: category.name })
                            setShowFemaleCategoryDropdown(false)
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Filtro de Temporada */}
                <select
                  className="bg-[#2145aa]/90 text-white text-sm px-2 py-2 border-0 rounded-none focus:ring-0 focus:outline-none w-[32%]"
                  value={femaleFilters.season}
                  onChange={(e) => updateFemaleFilters({ season: parseInt(e.target.value) })}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Painel Feminino */}
            <div className="bg-blue-700 rounded-sm overflow-hidden">
              <div className="bg-blue-600 py-3 px-4">
                <h3 className="text-white text-xl font-bold">MULHERES</h3>
              </div>
              
              {isLoadingFemaleEntries ? (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white/80">Carregando...</span>
                </div>
              ) : !femaleEntriesData?.data || femaleEntriesData.data.length === 0 ? (
                <div className="p-8 text-center text-white/80">
                  Nenhum ranking encontrado para os filtros selecionados.
                </div>
              ) : (
                <>
                  <div>
                    {femaleEntriesData.data.slice(0, 3).map((entry) => renderAthleteCard(entry))}
                  </div>
                  <Link 
                    href={`/rankings?modality=${femaleFilters.modality}&category=${femaleFilters.category}&gender=FEMALE&season=${femaleFilters.season}`}
                    className="block bg-blue-800 text-white text-center py-3 hover:bg-blue-900 transition-colors"
                  >
                    TODAS AS CLASSIFICAÇÕES →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-center text-white/60 text-sm mt-4">
          Os rankings são atualizados após cada evento oficial.
        </div>
      </div>
    </section>
  )
}
