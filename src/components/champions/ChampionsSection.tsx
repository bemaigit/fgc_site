'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { ChampionsFilters } from './ChampionsFilters'
import { useChampionModalitiesAndCategories } from '@/hooks/useChampionModalitiesAndCategories'
import { useChampionFilters, ChampionFiltersStore } from '../../stores/championFilters'

interface Champion {
  id: string
  athleteId: string
  name: string
  gender: string
  event: string
  ranking: number
  year: number
  category: string
  modality: string
  position: number
  team: string
  city: string
  imageUrl?: string
  athlete?: {
    image?: string
    fullName?: string
  }
}

// Função auxiliar para verificar se uma string é um UUID
function isUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

// Função auxiliar para extrair o ID de um objeto de forma segura
function getIdSafely(obj: unknown): string | undefined {
  if (!obj) return undefined;
  
  // Usando type assertion para acessar as propriedades de forma segura
  const item = obj as Record<string, unknown>;
  
  // Tenta acessar o ID em vários formatos possíveis
  const id = item.id || item._id || item.modalityId || item.categoryId;
  
  return id ? String(id) : undefined;
}

export function ChampionsSection() {
  // Estado para campeões masculinos
  const [isLoadingMale, setIsLoadingMale] = useState(false)
  const [errorMale, setErrorMale] = useState<string | null>(null)
  const [maleChampions, setMaleChampions] = useState<Champion[]>([])
  
  // Estado para campeões femininos
  const [isLoadingFemale, setIsLoadingFemale] = useState(false)
  const [errorFemale, setErrorFemale] = useState<string | null>(null)
  const [femaleChampions, setFemaleChampions] = useState<Champion[]>([])
  
  // Anos para os seletores de filtro
  const currentYear = new Date().getFullYear()
  const [maleYears, setMaleYears] = useState<number[]>(Array.from({ length: 5 }, (_, i) => currentYear - i))
  const [femaleYears, setFemaleYears] = useState<number[]>(Array.from({ length: 5 }, (_, i) => currentYear - i))
  const [isLoadingYears, setIsLoadingYears] = useState(false)
  
  // Dados de modalidades e categorias
  const { data } = useChampionModalitiesAndCategories()
  
  // Obtém filtros do store
  const maleFilters = useChampionFilters((state: ChampionFiltersStore) => state.male)
  const femaleFilters = useChampionFilters((state: ChampionFiltersStore) => state.female)
  const updateMaleFilters = useChampionFilters((state: ChampionFiltersStore) => state.updateMaleFilters)
  const updateFemaleFilters = useChampionFilters((state: ChampionFiltersStore) => state.updateFemaleFilters)

  // Buscar anos disponíveis para campeões
  useEffect(() => {
    async function fetchAvailableYears() {
      setIsLoadingYears(true)
      try {
        // Anos para campeões masculinos
        const maleResponse = await fetch(`/api/championships/years?gender=MALE`)
        if (maleResponse.ok) {
          const years = await maleResponse.json()
          if (years.length > 0) {
            setMaleYears(years)
          }
        }
        
        // Anos para campeões femininos
        const femaleResponse = await fetch(`/api/championships/years?gender=FEMALE`)
        if (femaleResponse.ok) {
          const years = await femaleResponse.json()
          if (years.length > 0) {
            setFemaleYears(years)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar anos disponíveis:', error)
      } finally {
        setIsLoadingYears(false)
      }
    }
    
    fetchAvailableYears()
  }, [])

  // Cria os parâmetros de busca de forma segura
  const buildSearchParams = useMemo(() => {
    return (modalityFilter: string | undefined, categoryFilter: string | undefined, genderFilter: string, yearFilter?: number) => {
      const params = new URLSearchParams()
      
      if (!data) return params;
      
      console.log('Dados disponíveis para construção de parâmetros:', {
        modalidades: data.modalities,
        categorias: data.categories,
        filtros: { modalityFilter, categoryFilter, genderFilter, yearFilter }
      })
      
      // Processa a modalidade
      if (modalityFilter) {
        if (isUUID(modalityFilter)) {
          params.append('modalityId', modalityFilter)
          console.log('Usando ID de modalidade diretamente:', modalityFilter)
        } else if (data.modalities) {
          // Encontra a modalidade pelo nome
          const foundModality = data.modalities.find(
            // Usando type assertion para compatibilidade
            (m) => (m as unknown as { name: string }).name === modalityFilter
          )
          const modalityId = getIdSafely(foundModality)
          console.log('Modalidade encontrada?', !!foundModality, 'ID:', modalityId, 'Nome buscado:', modalityFilter)
          if (modalityId) {
            params.append('modalityId', modalityId)
          }
        }
      }
      
      // Processa a categoria
      if (categoryFilter) {
        if (isUUID(categoryFilter)) {
          params.append('categoryId', categoryFilter)
          console.log('Usando ID de categoria diretamente:', categoryFilter)
        } else if (data.categories) {
          // Encontra a categoria pelo nome e modalidade
          const foundCategory = data.categories.find(
            // Usando type assertion para compatibilidade
            (c) => {
              const category = c as unknown as { name: string; modality?: string };
              const match = category.name === categoryFilter && 
                (!modalityFilter || category.modality === modalityFilter);
              console.log('Verificando categoria:', category.name, 'Esperado:', categoryFilter, 'Modalidade:', category.modality, 'Match:', match)
              return match;
            }
          )
          const categoryId = getIdSafely(foundCategory)
          console.log('Categoria encontrada?', !!foundCategory, 'ID:', categoryId, 'Nome buscado:', categoryFilter)
          if (categoryId) {
            params.append('categoryId', categoryId)
          }
        }
      }
      
      // Adiciona o gênero (a API aceita tanto 'FEMALE' quanto 'FEMININO')
      params.append('gender', genderFilter)
      
      // Adiciona o ano, se fornecido
      if (yearFilter) {
        params.append('year', yearFilter.toString())
      }
      
      return params
    }
  }, [data])

  // Buscar campeões masculinos com base nos filtros selecionados
  useEffect(() => {
    async function fetchMaleChampions() {
      // Não buscar até que haja modalidade e categoria selecionadas
      if (!maleFilters.modality || !maleFilters.category || !data) {
        setMaleChampions([])
        return
      }
      
      setIsLoadingMale(true)
      setErrorMale(null)
      
      try {
        const params = buildSearchParams(maleFilters.modality, maleFilters.category, 'MALE', maleFilters.year)
        
        console.log('Buscando campeões masculinos com params:', params.toString())
        const response = await fetch(`/api/championships/entries?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar campeões masculinos')
        }
        
        const data = await response.json()
        console.log('Dados brutos de campeões masculinos:', data)
        
        // Mapear dados para o formato Champion
        const mappedChampions = data.map((champion: any) => ({
          id: champion.id,
          athleteId: champion.athleteId,
          name: champion.athlete?.fullName || champion.Athlete?.fullName || champion.athleteName || 'Sem nome',
          gender: champion.gender,
          event: champion.ChampionshipEvent?.name || '',
          ranking: 0, // Não usado no momento
          year: champion.ChampionshipEvent?.year || champion.year || new Date().getFullYear(),
          category: champion.ChampionCategory?.name || champion.categoryName || 'Sem categoria',
          modality: champion.ChampionModality?.name || champion.modalityName || 'Sem modalidade',
          position: typeof champion.position === 'number' ? champion.position : 1,
          team: champion.team || 'Avulso',
          city: champion.city || '',
          imageUrl: champion.athleteImage || '', 
          athlete: {
            image: champion.athlete?.image || champion.Athlete?.User_Athlete_userIdToUser?.image || null,
            fullName: champion.athlete?.fullName || champion.Athlete?.fullName,
          },
        }))
        
        console.log('Campeões masculinos mapeados:', mappedChampions)
        setMaleChampions(mappedChampions)
      } catch (err: unknown) {
        console.error('Erro ao buscar campeões masculinos:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setErrorMale(errorMessage)
      } finally {
        setIsLoadingMale(false)
      }
    }

    fetchMaleChampions()
  }, [maleFilters.modality, maleFilters.category, maleFilters.year, data, buildSearchParams])

  // Buscar campeões femininos com base nos filtros selecionados
  useEffect(() => {
    async function fetchFemaleChampions() {
      // Não buscar até que haja modalidade e categoria selecionadas
      if (!femaleFilters.modality || !femaleFilters.category || !data) {
        setFemaleChampions([])
        return
      }
      
      setIsLoadingFemale(true)
      setErrorFemale(null)
      
      try {
        const params = buildSearchParams(femaleFilters.modality, femaleFilters.category, 'FEMALE', femaleFilters.year)
        
        console.log('Buscando campeões femininos com params:', params.toString())
        const response = await fetch(`/api/championships/entries?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar campeões femininos')
        }
        
        const data = await response.json()
        console.log('Dados brutos de campeões femininos:', data)
        
        // Mapear dados para o formato Champion
        const mappedChampions = data.map((champion: any) => ({
          id: champion.id,
          athleteId: champion.athleteId,
          name: champion.athlete?.fullName || champion.Athlete?.fullName || champion.athleteName || 'Sem nome',
          gender: champion.gender,
          event: champion.ChampionshipEvent?.name || '',
          ranking: 0, // Não usado no momento
          year: champion.ChampionshipEvent?.year || champion.year || new Date().getFullYear(),
          category: champion.ChampionCategory?.name || champion.categoryName || 'Sem categoria',
          modality: champion.ChampionModality?.name || champion.modalityName || 'Sem modalidade',
          position: typeof champion.position === 'number' ? champion.position : 1,
          team: champion.team || 'Avulso',
          city: champion.city || '',
          imageUrl: champion.athleteImage || '', 
          athlete: {
            image: champion.athlete?.image || champion.Athlete?.User_Athlete_userIdToUser?.image || null,
            fullName: champion.athlete?.fullName || champion.Athlete?.fullName,
          },
        }))
        
        console.log('Campeões femininos mapeados:', mappedChampions)
        setFemaleChampions(mappedChampions)
      } catch (err: unknown) {
        console.error('Erro ao buscar campeões femininos:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setErrorFemale(errorMessage)
      } finally {
        setIsLoadingFemale(false)
      }
    }

    fetchFemaleChampions()
  }, [femaleFilters.modality, femaleFilters.category, femaleFilters.year, data, buildSearchParams])

  // Renderiza card de campeão
  const renderChampionCard = (champion: Champion) => (
    <Link 
      href={`/atletas/${champion.athleteId}`} 
      key={champion.id} 
      className="flex items-center gap-4 p-4 border-b border-green-600/30 hover:bg-green-600/30 transition-colors"
    >
      {/* Posição */}
      <div className="text-3xl font-bold text-white w-10 text-center">
        {champion.position}
      </div>
      
      {/* Informações do Atleta */}
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar do atleta */}
        <div className="w-12 h-12 bg-green-600/50 rounded-full overflow-hidden flex-shrink-0">
          {champion.athlete?.image ? (
            <img 
              src={`/api/athletes/image?path=${encodeURIComponent(champion.athlete.image)}`} 
              alt={champion.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = '/images/placeholder-athlete.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {(champion.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-bold text-white text-lg">
            {champion.name}
          </h3>
          <div className="text-xs text-white/90 font-medium">
            {champion.team || 'Avulso'} {champion.city && `• ${champion.city}`}
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <section className="w-full bg-gradient-to-br from-[#0a8024] to-[#054012] py-12">
      <div className="container mx-auto px-4">
        
        {/* Grid com painéis lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Painel Masculino */}
          <div>
            {/* Filtros para painel masculino */}
            <div className="mb-4">
              {isLoadingYears ? (
                <div className="p-2 flex justify-center items-center text-white w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando anos disponíveis...</span>
                </div>
              ) : (
                <ChampionsFilters
                  filters={maleFilters}
                  onUpdateFilters={updateMaleFilters}
                  gender="MALE"
                  years={maleYears}
                />
              )}
            </div>
            
            {/* Painel de conteúdo masculino */}
            <div className="bg-[#096b1d] rounded-sm overflow-hidden">
              <div className="bg-[#0a8024] py-3 px-4">
                <h3 className="text-white text-xl font-bold">HOMENS</h3>
              </div>
              
              {isLoadingMale && (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white/80">Carregando...</span>
                </div>
              )}

              {errorMale && (
                <div className="p-8 text-center text-white/80">
                  Erro ao carregar dados dos campeões. Por favor, tente novamente.
                </div>
              )}

              {!isLoadingMale && !errorMale && (!maleChampions || maleChampions.length === 0) && (
                <div className="p-8 text-center text-white/80">
                  {maleFilters.modality && maleFilters.category 
                    ? "Nenhum campeão encontrado para os filtros selecionados."
                    : "Selecione uma modalidade e categoria para ver os campeões."}
                </div>
              )}

              {maleChampions && maleChampions.length > 0 && (
                <>
                  <div>
                    {maleChampions.slice(0, 3).map(champion => renderChampionCard(champion))}
                  </div>
                  <Link 
                    href={`/champions?modality=${maleFilters.modality}&category=${maleFilters.category}&gender=MALE&year=${maleFilters.year}`}
                    className="block bg-green-800 text-white text-center py-3 hover:bg-green-900 transition-colors"
                  >
                    VER TODOS OS CAMPEÕES →
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Painel Feminino */}
          <div>
            {/* Filtros para painel feminino */}
            <div className="mb-4">
              {isLoadingYears ? (
                <div className="p-2 flex justify-center items-center text-white w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando anos disponíveis...</span>
                </div>
              ) : (
                <ChampionsFilters
                  filters={femaleFilters}
                  onUpdateFilters={updateFemaleFilters}
                  gender="FEMALE"
                  years={femaleYears}
                />
              )}
            </div>
            
            {/* Painel de conteúdo feminino */}
            <div className="bg-[#096b1d] rounded-sm overflow-hidden">
              <div className="bg-[#0a8024] py-3 px-4">
                <h3 className="text-white text-xl font-bold">MULHERES</h3>
              </div>
              
              {isLoadingFemale && (
                <div className="p-8 flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                  <span className="ml-2 text-white/80">Carregando...</span>
                </div>
              )}

              {errorFemale && (
                <div className="p-8 text-center text-white/80">
                  Erro ao carregar dados das campeãs. Por favor, tente novamente.
                </div>
              )}

              {!isLoadingFemale && !errorFemale && (!femaleChampions || femaleChampions.length === 0) && (
                <div className="p-8 text-center text-white/80">
                  {femaleFilters.modality && femaleFilters.category 
                    ? "Nenhuma campeã encontrada para os filtros selecionados."
                    : "Selecione uma modalidade e categoria para ver as campeãs."}
                </div>
              )}

              {femaleChampions && femaleChampions.length > 0 && (
                <>
                  <div>
                    {femaleChampions.slice(0, 3).map(champion => renderChampionCard(champion))}
                  </div>
                  <Link 
                    href={`/champions?modality=${femaleFilters.modality}&category=${femaleFilters.category}&gender=FEMALE&year=${femaleFilters.year}`}
                    className="block bg-green-800 text-white text-center py-3 hover:bg-green-900 transition-colors"
                  >
                    VER TODAS AS CAMPEÃS →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
