'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'
import Link from 'next/link'
import { Search, ChevronRight, ChevronLeft, Filter } from 'lucide-react'
import { useAthleteModalitiesAndCategories } from '@/hooks/useAthleteModalitiesAndCategories'
import { useAthleteFilters } from '@/stores/athleteFilters'

interface Modality {
  id: string
  name: string
}

interface Athlete {
  id: string
  fullName: string
  category: string
  club: string
  profileImage: string | null
  birthDate: string
  hasBiography: boolean
  hasGallery: boolean
  modalities: Modality[] | string[]
  modalityName?: string  // Nome principal da modalidade do atleta
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

// Função auxiliar para converter IDs em nomes legíveis
const getReadableModalityName = (id: string): string => {
  // Mapeamento de IDs conhecidos para nomes legíveis
  const idToName: Record<string, string> = {
    '00ef4e35-0e03-4387-ac8b-2e70a0ecef49': 'MTB',
    '402e9e9d-3fd1-49c9-b6f4-12413801fb14': 'ROAD',
    'b12a1f42-8530-4a25-ab1f-f3a4661e4929': 'SPEED',
    'bcddde3d-45d3-4a6c-a098-df953056e0d1': 'BMX'
  };
  
  return idToName[id] || id;
};

// Função auxiliar para converter IDs de categorias em nomes legíveis
const getReadableCategoryName = (id: string): string => {
  // Mapeamento de IDs conhecidos para nomes legíveis
  const idToName: Record<string, string> = {
    'a39295d3-69e2-4864-8c71-c5d3807af22': 'Elite',
    'a0fa3764-acd8-40a0-9dde-e2b5ddb1f8aa': 'Sub-23',
    'c4ecd3a8-7b75-415a-93a8-3d1c1321037d': 'Junior',
    'dfa1d3c6-e243-42d9-aa05-b7d21cb81507': 'Juvenil',
    '7c8dd0b6-9af0-4778-9910-5c491cee6f53': 'Master A',
    'e0a2d10d-80c1-4d59-b5a9-49618cf1a8fe': 'Master B',
    'f2a2d45a-95d8-4b3e-b809-c32f84a79b70': 'Master C'
  };
  
  return idToName[id] || id;
};

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
  const [hasLoadedInitial, setHasLoadedInitial] = useState<boolean>(false) // Flag para controlar o carregamento inicial
  
  // Estados para controle de dropdowns
  const [showModalityDropdown, setShowModalityDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  
  // Estados para armazenar os nomes dos itens selecionados para exibição
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  
  // Filtrar categorias baseado na modalidade selecionada
  const filteredCategories = useMemo(() => {
    if (!modalitiesData?.categories || !filters.modality) return []
    
    // Obter categorias para a modalidade selecionada
    const categoriesForModality = modalitiesData.categories
      .filter(category => category.modality === filters.modality);
    
    // Eliminar duplicatas baseando-se no nome da categoria
    const uniqueCategories = Array.from(
      new Map(categoriesForModality.map(cat => [cat.name, cat]))
      .values()
    );
    
    return uniqueCategories.map(category => ({
      id: category.id,
      name: category.name,
      originalId: category.originalId // Manter o ID original para filtragem
    }));
  }, [modalitiesData?.categories, filters.modality])

  // Função para buscar atletas com base nos filtros
  const fetchAthletes = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = new URL('/api/athletes', window.location.origin)
      url.searchParams.append('page', page.toString())
      
      if (filters.search) {
        url.searchParams.append('search', filters.search)
      }
      
      if (filters.category) {
        // Encontrar a categoria selecionada nos dados carregados
        const selectedCategory = modalitiesData?.categories?.find(cat => cat.id === filters.category)
        
        if (selectedCategory?.originalId) {
          // Usar o ID original da categoria para a consulta no banco de dados
          url.searchParams.append('category', selectedCategory.originalId)
        } else if (modalitiesData?.mappings?.categories && 
            modalitiesData.mappings.categories[filters.category]) {
          // Fallback para os mapeamentos estáticos
          url.searchParams.append('category', modalitiesData.mappings.categories[filters.category])
        } else {
          // Último fallback: usar o valor original
          url.searchParams.append('category', filters.category)
        }
      }
      
      if (filters.modality) {
        // Verificar se temos mapeamentos de modalidades
        if (modalitiesData?.mappings?.modalities && 
            modalitiesData.mappings.modalities[filters.modality]) {
          // Usar o ID do mapeamento
          url.searchParams.append('modality', modalitiesData.mappings.modalities[filters.modality])
        } else {
          // Usar o valor original se não houver mapeamento
          url.searchParams.append('modality', filters.modality)
        }
      }
      
      if (filters.gender && filters.gender !== 'ALL') {
        // Usar os mapeamentos de gênero da API
        if (modalitiesData?.mappings?.genders && 
            modalitiesData.mappings.genders[filters.gender]) {
          url.searchParams.append('gender', modalitiesData.mappings.genders[filters.gender])
        } else {
          // Fallback para os valores anteriores
          let genderId;
          if (filters.gender === 'MALE') {
            genderId = 'b4f82f14-79d6-4123-a29b-4d45ff890a52';
          } else if (filters.gender === 'FEMALE') {
            genderId = '7718a8b0-03f1-42af-a484-6176f8bf055e';
          }
          url.searchParams.append('gender', genderId || filters.gender)
        }
      }
      
      // Log dos parâmetros da consulta para debug
      console.log('Buscando atletas com parâmetros:', Object.fromEntries(url.searchParams.entries()));
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error('Falha ao carregar atletas')
      }
      
      const data = await response.json()
      if (data && data.athletes) {
        setAthletes(data.athletes)
        setPagination(data.pagination)
        setError(null)
        console.log(`Carregados ${data.athletes.length} atletas de um total de ${data.pagination?.total || 'desconhecido'}`);
      } else {
        throw new Error('Formato de dados inválido')
      }
    } catch (err) {
      console.error('Erro ao buscar atletas:', err)
      setError('Não foi possível carregar a lista de atletas')
      setAthletes([])
    } finally {
      setLoading(false)
    }
  }, [filters, modalitiesData])
  
  // Efeito para carregar todos os atletas quando a página é inicializada sem filtros
  useEffect(() => {
    // Verifica se é a primeira vez que o componente é montado
    // e se não há filtros ativos
    const hasActiveFilters = filters.search || filters.modality || filters.category || (filters.gender && filters.gender !== 'ALL')
    
    if (!hasLoadedInitial && !hasActiveFilters) {
      // Define a flag para evitar recarregar
      setHasLoadedInitial(true)
      // Carrega todos os atletas sem filtros
      fetchAthletes(1)
      console.log('Carregando todos os atletas inicialmente sem filtros')
    }
  }, [hasLoadedInitial, filters, modalitiesData, fetchAthletes])
  
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
  
  // Redefinir os filtros e buscar novamente
  const handleReset = () => {
    resetFilters()
    // Limpar o nome da categoria exibido
    setSelectedCategoryName('')
    // Fechar qualquer dropdown aberto
    setShowCategoryDropdown(false)
    setShowModalityDropdown(false)
    setShowGenderDropdown(false)
    // Atualizar URL e buscar atletas
    updateUrlParams(1)
    fetchAthletes(1)
  }
  
  // Inicialização dos filtros a partir da URL quando o componente montar
  useEffect(() => {
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const searchParam = searchParams.get('search') || ''
    const categoryParam = searchParams.get('category') || ''
    const modalityParam = searchParams.get('modality') || ''
    const genderParam = searchParams.get('gender') as 'MALE' | 'FEMALE' | 'ALL' || 'ALL'
    
    // Atualizar filtros com valores da URL
    updateFilters({
      search: searchParam,
      category: categoryParam,
      modality: modalityParam,
      gender: genderParam === 'MALE' || genderParam === 'FEMALE' ? genderParam : 'ALL'
    })
    
    fetchAthletes(pageParam)
  }, [])
  
  // Efeito para carregar atletas quando os filtros mudarem
  useEffect(() => {
    if (!hasLoadedInitial) {
      setHasLoadedInitial(true)
      return
    }
    
    // Reseta para a primeira página ao mudar filtros
    updateUrlParams() 
    fetchAthletes()
  }, [filters])
  
  // Efeito para atualizar o nome da categoria selecionada ao carregar
  useEffect(() => {
    // Se tivermos filtro de categoria e dados carregados, encontrar o nome correto
    if (filters.category && filteredCategories.length > 0) {
      const selectedCategory = filteredCategories.find(cat => cat.id === filters.category)
      if (selectedCategory) {
        setSelectedCategoryName(selectedCategory.name)
      }
    }
  }, [filteredCategories, filters.category])

  // Manipuladores de eventos para os filtros
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrlParams()
    fetchAthletes(1)
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value })
  }
  
  const handleModalityChange = (modalityId: string, modalityName: string) => {
    // Armazenar o ID da modalidade para filtrar
    updateFilters({ modality: modalityId, category: '' })
    setShowModalityDropdown(false)
    
    // Debug
    console.log(`Selecionou modalidade: ${modalityName} (ID: ${modalityId})`)
  }
  
  const handleCategoryChange = (categoryId: string, categoryName: string, originalId: string | undefined) => {
    // Armazenar o ID da categoria para filtrar
    // Se temos um originalId (ID real na tabela), usamos ele como valor para filtragem
    updateFilters({ category: categoryId })
    
    // Armazena o nome legível da categoria para exibição na interface
    setSelectedCategoryName(categoryName)
    
    setShowCategoryDropdown(false)
    
    // Debug
    console.log(`Selecionou categoria: ${categoryName} (ID: ${categoryId}, OriginalID: ${originalId || 'não disponível'})`)
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
      {/* Barra de filtros - Estilo Ranking Goiano */}
      <div className="w-full bg-[#0078D7] p-6 rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Nossos Atletas</h2>
          <p className="text-white/80 text-sm">Conheça os atletas que representam a Federação Goiana de Ciclismo</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro de Modalidade */}
          <div className="relative min-w-[180px]">
            <div 
              onClick={() => setShowModalityDropdown(!showModalityDropdown)} 
              className="cursor-pointer flex justify-between items-center px-5 py-2 rounded-md bg-[#08285d] text-white"
            >
              <span className="font-medium truncate">{modalitiesData?.modalities?.find(m => m.id === filters.modality)?.name || 'Selecione a modalidade'}</span>
              <span className="ml-2">+</span>
            </div>
            {showModalityDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {isLoadingOptions ? (
                  <div className="p-3 text-center text-gray-600">Carregando...</div>
                ) : modalitiesData?.modalities && modalitiesData.modalities.length > 0 ? (
                  modalitiesData.modalities.map(modality => (
                    <div 
                      key={modality.id} 
                      className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${filters.modality === modality.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                      onClick={() => handleModalityChange(modality.id, modality.name)}
                    >
                      {modality.name}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-600">Nenhuma modalidade disponível</div>
                )}
              </div>
            )}
          </div>
          
          {/* Filtro de Categoria */}
          <div className="relative min-w-[180px]">
            <div 
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} 
              className="cursor-pointer flex justify-between items-center px-5 py-2 rounded-md bg-[#08285d] text-white"
            >
              <span className="font-medium truncate">{selectedCategoryName || 'Selecione a categoria'}</span>
              <span className="ml-2">+</span>
            </div>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {!filters.modality ? (
                  <div className="p-3 text-center text-gray-600">Selecione uma modalidade primeiro</div>
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <div 
                      key={category.id} 
                      className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${filters.category === category.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                      onClick={() => handleCategoryChange(category.id, category.name, category.originalId)}
                    >
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-600">Nenhuma categoria disponível</div>
                )}
              </div>
            )}
          </div>
          
          {/* Filtro de Gênero */}
          <div className="relative min-w-[180px]">
            <div 
              onClick={() => setShowGenderDropdown(!showGenderDropdown)} 
              className="cursor-pointer flex justify-between items-center px-5 py-2 rounded-md bg-[#08285d] text-white"
            >
              <span className="font-medium">
                {filters.gender === 'MALE' ? 'Masculino' : 
                filters.gender === 'FEMALE' ? 'Feminino' : 'Todos os gêneros'}
              </span>
              <span className="ml-2">+</span>
            </div>
            {showGenderDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${filters.gender === 'ALL' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                  onClick={() => handleGenderChange('ALL')}
                >
                  Todos os gêneros
                </div>
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${filters.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                  onClick={() => handleGenderChange('MALE')}
                >
                  Masculino
                </div>
                <div 
                  className={`p-3 cursor-pointer hover:bg-gray-100 transition-colors ${filters.gender === 'FEMALE' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                  onClick={() => handleGenderChange('FEMALE')}
                >
                  Feminino
                </div>
              </div>
            )}
          </div>
          
          {/* Campo de busca */}
          <div className="flex-1 min-w-[250px]">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                placeholder="Buscar atleta por nome..."
                className="w-full px-4 py-2 pr-12 rounded-md border border-[#08285d]/20 bg-white focus:outline-none focus:ring-2 focus:border-[#08285d] text-gray-800"
                value={filters.search}
                onChange={handleSearchChange}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-[#08285d]"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
          
          {/* Botão de reset */}
          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-md bg-white text-[#08285d] font-medium hover:bg-gray-100 transition-colors"
          >
            Limpar filtros
          </button>
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
        ) : !athletes || athletes.length === 0 ? (
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
                  className="bg-[#08285d] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px] hover:bg-[#0a3172]"
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
                    <h3 className="text-lg font-bold text-white truncate">{athlete.fullName}</h3>
                    <div className="mt-2 flex flex-col space-y-1">
                      <span className="text-sm text-white/90">
                        Categoria: {athlete.category || 'Não informada'}
                      </span>
                      <span className="text-sm text-white/90">
                        Equipe: {athlete.club || 'Não informada'}
                      </span>
                      <span className="text-sm text-white/90">
                        Modalidade: {athlete.modalityName || 'Não informada'}
                      </span>
                    </div>
                    
                    {/* Ícones indicando conteúdo disponível */}
                    <div className="mt-3 flex justify-end space-x-2">
                      {athlete.hasBiography && (
                        <div className="text-xs px-2 py-1 bg-blue-600 text-white rounded font-medium">Bio</div>
                      )}
                      {athlete.hasGallery && (
                        <div className="text-xs px-2 py-1 bg-purple-600 text-white rounded font-medium">Galeria</div>
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
