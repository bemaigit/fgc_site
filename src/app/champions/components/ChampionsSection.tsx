'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { useChampionFilters, ChampionFilters } from '@/stores/championFilters'
import { ChampionsFilters } from './ChampionsFilters'
import { ChampionsList } from './ChampionsList'

// Interface para o tipo Champion
export interface Champion {
  id: string
  athleteId: string
  modality?: string
  category?: string
  modalityId?: string
  categoryId?: string
  gender: string
  position: number
  city: string
  team: string | null
  year?: number
  createdAt: string
  
  // Campos formatados pela API
  athleteName?: string
  athleteImage?: string | null
  modalityName?: string
  categoryName?: string
  
  // Relações (objetos completos)
  athlete?: {
    id: string
    fullName: string
    image: string | null
  }
  ChampionModality?: {
    id: string
    name: string
  }
  ChampionCategory?: {
    id: string
    name: string
  }
  ChampionshipEvent?: {
    id: string
    year: number
  }
}

export function ChampionsSection() {
  const [activeTab, setActiveTab] = useState<'male' | 'female'>('male')
  const [maleChampions, setMaleChampions] = useState<Champion[]>([])
  const [femaleChampions, setFemaleChampions] = useState<Champion[]>([])
  const [isLoadingMale, setIsLoadingMale] = useState(false)
  const [isLoadingFemale, setIsLoadingFemale] = useState(false)
  const [errorMale, setErrorMale] = useState<string | null>(null)
  const [errorFemale, setErrorFemale] = useState<string | null>(null)
  
  // Obtém filtros do store
  const maleFilters = useChampionFilters((state) => state.male)
  const femaleFilters = useChampionFilters((state) => state.female)
  const updateMaleFilters = useChampionFilters((state) => state.updateMaleFilters)
  const updateFemaleFilters = useChampionFilters((state) => state.updateFemaleFilters)
  
  const filters = activeTab === 'male' ? maleFilters : femaleFilters
  const updateFilters = activeTab === 'male' ? updateMaleFilters : updateFemaleFilters

  // Anos para os seletores de filtro
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Função para construir parâmetros de busca
  const buildSearchParams = (filters: ChampionFilters) => {
    const params = new URLSearchParams()
    
    if (filters.modality) {
      params.append('modality', filters.modality)
    }
    
    if (filters.category) {
      params.append('category', filters.category)
    }
    
    if (filters.year) {
      params.append('year', filters.year.toString())
    }
    
    return params
  }

  // Buscar campeões masculinos com base nos filtros selecionados
  useEffect(() => {
    if (!maleFilters.modality || !maleFilters.category) {
      setMaleChampions([])
      return
    }

    async function fetchMaleChampions() {
      setIsLoadingMale(true)
      setErrorMale(null)
      
      try {
        const params = buildSearchParams(maleFilters)
        params.append('gender', 'MALE')
        
        const response = await fetch(`/api/championships/entries?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar campeões masculinos')
        }
        
        const data = await response.json()
        setMaleChampions(data)
      } catch (err: unknown) {
        console.error('Erro ao buscar campeões masculinos:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setErrorMale(errorMessage)
      } finally {
        setIsLoadingMale(false)
      }
    }

    fetchMaleChampions()
  }, [maleFilters.modality, maleFilters.category, maleFilters.year])

  // Buscar campeões femininos com base nos filtros selecionados
  useEffect(() => {
    if (!femaleFilters.modality || !femaleFilters.category) {
      setFemaleChampions([])
      return
    }
    
    async function fetchFemaleChampions() {
      setIsLoadingFemale(true)
      setErrorFemale(null)
      
      try {
        const params = buildSearchParams(femaleFilters)
        params.append('gender', 'FEMALE')
        
        const response = await fetch(`/api/championships/entries?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar campeões femininos')
        }
        
        const data = await response.json()
        setFemaleChampions(data)
      } catch (err: unknown) {
        console.error('Erro ao buscar campeões femininos:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setErrorFemale(errorMessage)
      } finally {
        setIsLoadingFemale(false)
      }
    }

    fetchFemaleChampions()
  }, [femaleFilters.modality, femaleFilters.category, femaleFilters.year])

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'male' | 'female')
    
    // Garantir que os filtros de ano sejam mantidos entre as abas
    const currentYear = filters.year
    if (value === 'male' && femaleFilters.year !== currentYear) {
      updateMaleFilters({ year: currentYear })
    } else if (value === 'female' && maleFilters.year !== currentYear) {
      updateFemaleFilters({ year: currentYear })
    }
  }

  const renderContent = () => {
    const champions = activeTab === 'male' ? maleChampions : femaleChampions
    const isLoading = activeTab === 'male' ? isLoadingMale : isLoadingFemale
    const error = activeTab === 'male' ? errorMale : errorFemale

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="ml-2 text-white/80">
            Carregando campeões...
          </span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center p-8 text-white/80">
          Erro ao carregar dados dos campeões. Por favor, tente novamente.
        </div>
      )
    }

    if (!champions || champions.length === 0) {
      return (
        <div className="text-center p-8 text-white/80">
          Nenhum campeão encontrado para os filtros selecionados.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <ChampionsList champions={champions} />
      </div>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-[#096b1d] to-[#064514] w-full flex flex-col items-center">
      <div className="w-full max-w-4xl px-4">
        <h2 className="text-3xl font-bold text-white mb-8">
          Campeões FGC
        </h2>

        <Tabs 
          defaultValue="male" 
          value={activeTab} 
          onValueChange={handleTabChange}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="male" className="data-[state=active]:bg-white data-[state=active]:text-green-600">
              Masculino
            </TabsTrigger>
            <TabsTrigger value="female" className="data-[state=active]:bg-white data-[state=active]:text-green-600">
              Feminino
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">
            <ChampionsFilters
              filters={filters}
              onUpdateFilters={updateFilters}
              gender={activeTab === 'male' ? 'MALE' : 'FEMALE'}
              years={years}
            />
            {renderContent()}
          </div>
        </Tabs>
      </div>
    </section>
  )
}
