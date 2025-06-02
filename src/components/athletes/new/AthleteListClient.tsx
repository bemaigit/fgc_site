'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'
import Link from 'next/link'
import { Search, ChevronRight, ChevronLeft, Filter } from 'lucide-react'
import { useAthleteModalitiesAndCategories } from '@/hooks/useAthleteModalitiesAndCategories'
import { useAthleteFilters } from '@/stores/athleteFilters'

interface Athlete {
  id: string
  fullName: string
  category: string
  club: string
  profileImage: string | null
  birthDate: string
  hasBiography: boolean
  hasGallery: boolean
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
}

interface AthleteListProps {
  initialData: {
    athletes: Athlete[]
    pagination: PaginationInfo
  }
}

export function AthleteListClient({ initialData }: AthleteListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Obter dados de modalidades e categorias
  const { data: modalitiesData, isLoading: isLoadingOptions } = useAthleteModalitiesAndCategories()
  
  // Usar o store para os filtros
  const filters = useAthleteFilters((state) => state.filters)
  const updateFilters = useAthleteFilters((state) => state.updateFilters)
  const resetFilters = useAthleteFilters((state) => state.resetFilters)
  
  // Estados para a lista de atletas
  const [athletes, setAthletes] = useState<Athlete[]>(initialData.athletes)
  const [pagination, setPagination] = useState<PaginationInfo>(initialData.pagination)
  const [loading, setLoading] = useState(false) // Inicialmente false já que temos dados iniciais
  const [error, setError] = useState<string | null>(null)
  
  // Estados para controle de dropdowns
  const [showModalityDropdown, setShowModalityDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  
  // Filtrar categorias baseado na modalidade selecionada
  const filteredCategories = useMemo(() => {
    if (!modalitiesData?.categories || !filters.modality) return []
    
    return modalitiesData.categories
      .filter(category => category.modality === filters.modality)
      .map(category => ({
        id: category.id,
        name: category.name
      }))
  }, [modalitiesData?.categories, filters.modality])

  // Função para buscar atletas com base nos filtros
  const fetchAthletes = async (page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = new URL('/api/athletes', window.location.origin)
      url.searchParams.append('page', page.toString())
      
      if (filters.search) {
        url.searchParams.append('search', filters.search)
      }
      
      if (filters.category) {
        url.searchParams.append('category', filters.category)
      }
      
      if (filters.modality) {
        url.searchParams.append('modality', filters.modality)
      }
      
      if (filters.gender && filters.gender !== 'ALL') {
        url.searchParams.append('gender', filters.gender)
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Falha ao carregar atletas')
      }
      
      const data = await response.json()
      setAthletes(data.athletes)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      console.error('Erro ao buscar atletas:', err)
      setError('Não foi possível carregar a lista de atletas')
      setAthletes([])
    } finally {
      setLoading(false)
    }
  }
  
  // Atualiza a URL com os parâmetros de busca
  const updateUrlParams = (page = 1) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (filters.search) {
      params.set('search', filters.search)
    } else {
      params.delete('search')
    }
    
    if (filters.category) {
      params.set('category', filters.category)
    } else {
      params.delete('category')
    }
    
    if (filters.modality) {
      params.set('modality', filters.modality)
    } else {
      params.delete('modality')
    }
    
    if (filters.gender && filters.gender !== 'ALL') {
      params.set('gender', filters.gender)
    } else {
      params.delete('gender')
    }
    
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    
    // Construir nova URL
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl, { scroll: false })
  }
  
  // Inicializar modalidade e categoria quando os dados forem carregados
  useEffect(() => {
    if (modalitiesData?.modalities && modalitiesData.modalities.length > 0 && !filters.modality) {
      updateFilters({ modality: modalitiesData.modalities[0].name })
    }
  }, [modalitiesData?.modalities, filters.modality, updateFilters])
  
  // Resetar categoria quando a modalidade mudar
  useEffect(() => {
    if (filteredCategories.length > 0 && !filters.category) {
      updateFilters({ category: filteredCategories[0].name })
    } else if (filteredCategories.length === 0) {
      updateFilters({ category: '' })
    }
  }, [filteredCategories, filters.category, updateFilters])
  
  // Redefinir os filtros e buscar novamente
  const handleReset = () => {
    resetFilters()
    updateUrlParams()
    fetchAthletes(1)
  }
  
  // Inicializar filtros a partir da URL quando o componente montar
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const modality = searchParams.get('modality') || ''
    const gender = searchParams.get('gender') as 'MALE' | 'FEMALE' | 'ALL' || 'ALL'
    
    // Atualizar filtros com valores da URL
    updateFilters({
      search,
      category,
      modality,
      gender: gender === 'MALE' || gender === 'FEMALE' ? gender : 'ALL'
    })
    
    fetchAthletes(page)
  }, [])
  
  // Quando os filtros mudam, atualiza a URL e busca novamente
  useEffect(() => {
    updateUrlParams()
    fetchAthletes(1)
  }, [filters.modality, filters.category, filters.gender])

  // Manipuladores de eventos para os filtros
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrlParams()
    fetchAthletes(1)
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value })
  }
  
  const handleModalityChange = (modality: string) => {
    updateFilters({ modality, category: '' })
    setShowModalityDropdown(false)
  }
  
  const handleCategoryChange = (category: string) => {
    updateFilters({ category })
    setShowCategoryDropdown(false)
  }
  
  const handleGenderChange = (gender: 'MALE' | 'FEMALE' | 'ALL') => {
    updateFilters({ gender })
    setShowGenderDropdown(false)
  }
  
  const handlePageChange = (page: number) => {
    updateUrlParams(page)
    fetchAthletes(page)
  }
  
  return (
    <>
      {/* Barra de filtros */}
      <div className="mb-8 bg-gray-900/40 p-4 rounded-lg">
        <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between">
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar atleta por nome..."
                className="w-full px-4 py-2 pr-12 rounded-lg border bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:border-blue-500"
                value={filters.search}
                onChange={handleSearchChange}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-white/80 hover:text-white"
              >
                <Search size={18} />
              </button>
            </div>
          </form>
          
          {/* Botão de reset */}
          <button
            onClick={handleReset}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Modalidade */}
          <div className="relative">
            <div 
              onClick={() => setShowModalityDropdown(!showModalityDropdown)} 
              className="cursor-pointer flex justify-between items-center px-4 py-2 rounded-lg border bg-white/5 border-white/10"
            >
              <span>{filters.modality || 'Selecione a modalidade'}</span>
              <Filter size={18} />
            </div>
            {showModalityDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingOptions ? (
                  <div className="p-3 text-center">Carregando...</div>
                ) : modalitiesData?.modalities && modalitiesData.modalities.length > 0 ? (
                  modalitiesData.modalities.map(modality => (
                    <div 
                      key={modality.id} 
                      className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${filters.modality === modality.name ? 'bg-blue-900/50' : ''}`}
                      onClick={() => handleModalityChange(modality.name)}
                    >
                      {modality.name}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center">Nenhuma modalidade disponível</div>
                )}
              </div>
            )}
          </div>
          
          {/* Filtro de Categoria */}
          <div className="relative">
            <div 
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} 
              className="cursor-pointer flex justify-between items-center px-4 py-2 rounded-lg border bg-white/5 border-white/10"
            >
              <span>{filters.category || 'Selecione a categoria'}</span>
              <Filter size={18} />
            </div>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {!filters.modality ? (
                  <div className="p-3 text-center">Selecione uma modalidade primeiro</div>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <div 
                      key={category.id} 
                      className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${filters.category === category.name ? 'bg-blue-900/50' : ''}`}
                      onClick={() => handleCategoryChange(category.name)}
                    >
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center">Nenhuma categoria disponível</div>
                )}
              </div>
            )}
          </div>
          
          {/* Filtro de Gênero */}
          <div className="relative">
            <div 
              onClick={() => setShowGenderDropdown(!showGenderDropdown)} 
              className="cursor-pointer flex justify-between items-center px-4 py-2 rounded-lg border bg-white/5 border-white/10"
            >
              <span>
                {filters.gender === 'MALE' ? 'Masculino' : 
                 filters.gender === 'FEMALE' ? 'Feminino' : 'Todos os gêneros'}
              </span>
              <Filter size={18} />
            </div>
            {showGenderDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${filters.gender === 'ALL' ? 'bg-blue-900/50' : ''}`}
                  onClick={() => handleGenderChange('ALL')}
                >
                  Todos os gêneros
                </div>
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${filters.gender === 'MALE' ? 'bg-blue-900/50' : ''}`}
                  onClick={() => handleGenderChange('MALE')}
                >
                  Masculino
                </div>
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${filters.gender === 'FEMALE' ? 'bg-blue-900/50' : ''}`}
                  onClick={() => handleGenderChange('FEMALE')}
                >
                  Feminino
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de atletas */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Nenhum atleta encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <>
            {/* Grade de atletas - Ajustada para mostrar 2 cards por linha em celulares */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {athletes.map((athlete) => (
                <Link 
                  href={`/atletas/${athlete.id}`} 
                  key={athlete.id}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px] hover:bg-gray-700/70"
                >
                  {/* Imagem do atleta */}
                  <div className="relative h-64 w-full bg-gray-200">
                    {athlete.profileImage ? (
                      <Image
                        src={processProfileImageUrl(athlete.profileImage)}
                        alt={athlete.fullName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder-athlete.jpg'
                          target.onerror = null
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Image
                          src="/images/placeholder-athlete.jpg"
                          alt="Imagem não disponível"
                          width={200}
                          height={200}
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Informações do atleta */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white truncate">{athlete.fullName}</h3>
                    <div className="mt-2 flex flex-col space-y-1">
                      <span className="text-sm text-gray-300">
                        Categoria: {athlete.category || 'Não informada'}
                      </span>
                      <span className="text-sm text-gray-300">
                        Equipe: {athlete.club || 'Não informada'}
                      </span>
                    </div>
                    
                    {/* Ícones indicando conteúdo disponível */}
                    <div className="mt-3 flex justify-end space-x-2">
                      {athlete.hasBiography && (
                        <div className="text-xs px-2 py-1 bg-blue-900/60 text-blue-100 rounded">Bio</div>
                      )}
                      {athlete.hasGallery && (
                        <div className="text-xs px-2 py-1 bg-purple-900/60 text-purple-100 rounded">Galeria</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-10">
                <nav className="flex gap-2">
                  {/* Botão anterior */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`flex items-center px-3 py-1 rounded-md ${pagination.page === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
                  >
                    <ChevronLeft size={18} className="mr-1" />
                    Anterior
                  </button>
                  
                  {/* Números das páginas */}
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${page === pagination.page ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {/* Botão próximo */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className={`flex items-center px-3 py-1 rounded-md ${pagination.page === pagination.pages ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:bg-gray-700'}`}
                  >
                    Próximo
                    <ChevronRight size={18} className="ml-1" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
