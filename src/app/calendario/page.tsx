'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Tag, Award, Flag, Filter, Search, ChevronRight, ExternalLink, ChevronLeft } from 'lucide-react'
import { format, isAfter, isBefore, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tipos
interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startdate: string
  enddate: string
  modality: string
  category: string
  city: string
  uf: string
  status: string
  website: string | null
  imageurl: string | null
  regulationpdf: string | null
  highlight: boolean
}

// Componente de card de evento
const EventCard = ({ event }: { event: CalendarEvent }) => {
  const startDate = parseISO(event.startdate)
  const endDate = parseISO(event.enddate)
  
  // Formatar data no estilo "12 FEV 2024"
  const formatEventDate = (date: Date) => {
    return format(date, "dd MMM yyyy", { locale: ptBR }).toUpperCase()
  }
  
  // Determinar o status visual do evento
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado': return 'bg-green-100 text-green-800 border-green-300'
      case 'provisório': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-300'
      case 'adiado': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'concluído': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  
  return (
    <div className="flex flex-col bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 h-full">
      {/* Cabeçalho do card */}
      <div className="p-3 bg-[#08285d] text-white flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider">{event.modality}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(event.status)}`}>
          {event.status}
        </span>
      </div>
      
      {/* Imagem do evento (se disponível) */}
      <div className="relative h-32 sm:h-36 md:h-40 w-full bg-gray-200">
        {event.imageurl ? (
          <Image
            src={event.imageurl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400">Sem imagem</span>
          </div>
        )}
        {event.highlight && (
          <div className="absolute top-2 right-2">
            <Flag className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
        )}
      </div>
      
      {/* Conteúdo do card */}
      <div className="p-3 sm:p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">{event.title}</h3>
        
        <div className="space-y-1 sm:space-y-2 mt-1 sm:mt-2 text-xs sm:text-sm flex-grow">
          <div className="flex items-start">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#08285d] mr-1 sm:mr-2 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {formatEventDate(startDate)}
              {!isSameDay(startDate, endDate) && ` a ${formatEventDate(endDate)}`}
            </span>
          </div>
          
          <div className="flex items-start">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-[#08285d] mr-1 sm:mr-2 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.city}/{event.uf}</span>
          </div>
          
          <div className="flex items-start">
            <Award className="h-3 w-3 sm:h-4 sm:w-4 text-[#08285d] mr-1 sm:mr-2 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.category}</span>
          </div>
        </div>
        
        {/* Rodapé do card com link para mais detalhes */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Link 
            href={`/calendario/evento/${event.id}`}
            className="inline-flex items-center text-sm font-medium text-[#08285d] hover:text-[#7db0de]"
          >
            VER MAIS <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
          
          {event.regulationpdf && (
            <a 
              href={event.regulationpdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-[#08285d] hover:text-[#7db0de] ml-4"
            >
              REGULAMENTO <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Função auxiliar para verificar se duas datas são o mesmo dia
function isSameDay(date1: Date, date2: Date) {
  return date1.getDate() === date2.getDate() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
}

// Componente de filtro
const FilterSection = ({ 
  modalities, 
  selectedModality, 
  setSelectedModality,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm
}: { 
  modalities: string[],
  selectedModality: string,
  setSelectedModality: (modality: string) => void,
  categories: string[],
  selectedCategory: string,
  setSelectedCategory: (category: string) => void,
  searchTerm: string,
  setSearchTerm: (term: string) => void
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar evento
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              placeholder="Nome do evento, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#7db0de] focus:border-[#7db0de]"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="modality" className="block text-sm font-medium text-gray-700 mb-1">
            Modalidade
          </label>
          <select
            id="modality"
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-[#7db0de] focus:border-[#7db0de]"
          >
            <option value="">Todas as modalidades</option>
            {modalities.map((modality) => (
              <option key={modality} value={modality}>{modality}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md focus:ring-[#7db0de] focus:border-[#7db0de]"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// Página principal do calendário
export default function CalendarioPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  
  // Estados para filtragem
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModality, setSelectedModality] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [activeTab, setActiveTab] = useState<'proximos' | 'anteriores' | 'todos'>('proximos')
  
  // Carregar eventos do calendário e o banner
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Buscar eventos
        const eventsResponse = await fetch('/api/calendar-event')
        if (!eventsResponse.ok) throw new Error('Erro ao carregar eventos')
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
        
        // Buscar banner
        const bannerResponse = await fetch('/api/banner/calendar')
        if (bannerResponse.ok) {
          const bannerData = await bannerResponse.json()
          setBannerUrl(bannerData.bannerUrl)
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setError('Não foi possível carregar os eventos. Por favor, tente novamente mais tarde.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Extrair modalidades e categorias únicas para os filtros
  const modalities = [...new Set(events.map(event => event.modality))].sort()
  const categories = [...new Set(events.map(event => event.category))].sort()
  
  // Filtrar eventos com base nos critérios selecionados
  const filteredEvents = events.filter(event => {
    // Filtro de busca textual
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de modalidade
    const matchesModality = selectedModality === '' || event.modality === selectedModality
    
    // Filtro de categoria
    const matchesCategory = selectedCategory === '' || event.category === selectedCategory
    
    // Filtro por data (próximos/anteriores)
    const startDate = parseISO(event.startdate)
    const endDate = parseISO(event.enddate)
    const isUpcoming = isToday(startDate) || isAfter(startDate, new Date())
    const isPast = isBefore(endDate, new Date()) && !isToday(endDate)
    
    const matchesDateFilter = 
      (activeTab === 'proximos' && isUpcoming) ||
      (activeTab === 'anteriores' && isPast) ||
      (activeTab === 'todos')
    
    return matchesSearch && matchesModality && matchesCategory && matchesDateFilter
  })

  // Ordenar eventos (próximos: mais próximos primeiro; anteriores: mais recentes primeiro)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (activeTab === 'proximos' || activeTab === 'todos') {
      return new Date(a.startdate).getTime() - new Date(b.startdate).getTime()
    } else {
      return new Date(b.startdate).getTime() - new Date(a.startdate).getTime()
    }
  })

  // Separar eventos em destaque para a seção de destaque
  const highlightedEvents = events.filter(event => event.highlight && (isToday(parseISO(event.startdate)) || isAfter(parseISO(event.startdate), new Date())))
  
  // Renderizar carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="loader h-12 w-12 border-4 border-t-[#08285d] border-[#e5e7eb] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando eventos do calendário...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Renderizar erro
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Botão Voltar - Acima do banner */}
      <div className="container mx-auto px-4 py-3">
        <Link 
          href="/" 
          className="inline-flex items-center text-[#08285d] hover:text-[#7db0de] transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span className="font-medium">Voltar</span>
        </Link>
      </div>
      
      {/* Banner do Calendário */}
      <div className="relative w-full overflow-hidden">
        {/* Container com proporção fixa para manter relação de aspecto */}
        <div className="w-full h-0 pb-[56%] sm:pb-[50%] md:pb-[45%] lg:pb-[40%] relative">
          <div className="absolute inset-0 bg-black">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(8,40,93,0.9)]"></div>
            <Image 
              src={bannerUrl || '/images/banner-calendario-default.jpg'} 
              alt="Calendário da Federação Goiana de Ciclismo"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 sm:pb-8 md:pb-12 lg:pb-16 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2 sm:mb-4">CALENDÁRIO</h1>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 max-w-4xl px-2">
              <button 
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'todos' ? 'bg-white text-[#08285d]' : 'text-white hover:bg-white/10'
                }`}
              >
                TODOS
              </button>
              <button 
                onClick={() => setActiveTab('proximos')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'proximos' ? 'bg-white text-[#08285d]' : 'text-white hover:bg-white/10'
                }`}
              >
                PRÓXIMOS EVENTOS
              </button>
              <button 
                onClick={() => setActiveTab('anteriores')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'anteriores' ? 'bg-white text-[#08285d]' : 'text-white hover:bg-white/10'
                }`}
              >
                EVENTOS ANTERIORES
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Seção em destaque (se houver eventos destacados) */}
        {highlightedEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">EM DESTAQUE</h2>
            <div className="relative group touch-pan-x">
              {/* Container com scroll horizontal */}
              <div
                className="
                  overflow-x-auto
                  scrollbar-hide
                  snap-x
                  snap-mandatory
                  grid
                  grid-flow-col
                  auto-cols-[calc(80%-0.75rem)]
                  sm:auto-cols-[calc(45%-0.75rem)]
                  md:auto-cols-[calc(33.333%-0.75rem)]
                  lg:auto-cols-[calc(25%-0.75rem)]
                  gap-3
                  pb-2
                "
              >
                {highlightedEvents.map((event) => (
                  <div key={event.id} className="snap-start pl-4 first:pl-0">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
              
              {/* Botões de navegação */}
              <button
                className="
                  absolute
                  left-0
                  top-1/2
                  -translate-y-1/2
                  -translate-x-1/2
                  bg-white
                  rounded-full
                  shadow-md
                  p-2
                  opacity-0
                  group-hover:opacity-80
                  focus:opacity-100
                  transition-opacity
                  hidden
                  sm:flex
                  items-center
                  justify-center
                  z-10
                "
                onClick={() => {
                  const container = document.querySelector('.scrollbar-hide') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
                  }
                }}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <button
                className="
                  absolute
                  right-0
                  top-1/2
                  -translate-y-1/2
                  translate-x-1/2
                  bg-white
                  rounded-full
                  shadow-md
                  p-2
                  opacity-0
                  group-hover:opacity-80
                  focus:opacity-100
                  transition-opacity
                  hidden
                  sm:flex
                  items-center
                  justify-center
                  z-10
                "
                onClick={() => {
                  const container = document.querySelector('.scrollbar-hide') as HTMLElement;
                  if (container) {
                    container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
                  }
                }}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
        
        {/* Filtros */}
        <FilterSection 
          modalities={modalities}
          selectedModality={selectedModality}
          setSelectedModality={setSelectedModality}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Lista de eventos */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {activeTab === 'proximos' && 'PRÓXIMOS EVENTOS'}
          {activeTab === 'anteriores' && 'EVENTOS ANTERIORES'}
          {activeTab === 'todos' && 'TODOS OS EVENTOS'}
        </h2>
        
        {sortedEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">Nenhum evento encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          activeTab !== 'proximos' ? (
            // Eventos anteriores e todos - mostrar sempre como cards
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {sortedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            // Próximos eventos - sempre no formato lista
            <div className="space-y-1">
              {sortedEvents.map((event, index) => (
                <Link 
                  href={`/calendario/evento/${event.id}`} 
                  key={event.id}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="flex items-start py-4 border-b border-gray-200">
                    <div className="w-10 flex-shrink-0 flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-[#0068c9]">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 uppercase text-base line-clamp-1">
                        {event.title}
                      </h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mt-1 gap-y-1 sm:gap-x-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{event.city}/{event.uf}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>
                            {format(parseISO(event.startdate), "dd MMM", { locale: ptBR })} - {format(parseISO(event.enddate), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
                      <div 
                        className="h-1 mt-3 rounded-full" 
                        style={{ 
                          backgroundColor: event.highlight ? '#f59e0b' : '#3b82f6'
                        }}
                      ></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
