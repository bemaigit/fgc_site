'use client'

import { BarChart3, Users, Calendar, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DashboardStats {
  totalAthletes: number
  activeEvents: number
  publishedNews: number
  documents: number
}

interface Activity {
  type: string
  title: string
  description: string
  date: string
}

// Tipos de filtros disponíveis
type FilterType = 'all' | 'athletes' | 'events' | 'news' | 'documents'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  // Função para filtrar as atividades com base no filtro ativo
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setActivities(allActivities);
      return;
    }
    
    // Filtrar atividades com base no tipo selecionado
    const filteredActivities = allActivities.filter(activity => {
      switch (filter) {
        case 'athletes':
          return activity.type === 'membership';
        case 'events':
          return activity.type === 'registration';
        case 'news':
          // Se houvesse atividades de notícias, filtrar aqui
          return activity.type === 'news';
        case 'documents':
          // Se houvesse atividades de documentos, filtrar aqui
          return activity.type === 'document';
        default:
          return true;
      }
    });
    
    setActivities(filteredActivities);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Buscar estatísticas
        const statsResponse = await fetch('/api/dashboard/stats')
        if (!statsResponse.ok) {
          throw new Error('Falha ao buscar estatísticas')
        }
        const statsData = await statsResponse.json()
        
        // Buscar atividades recentes
        const activitiesResponse = await fetch('/api/dashboard/activities')
        if (!activitiesResponse.ok) {
          throw new Error('Falha ao buscar atividades recentes')
        }
        const activitiesData = await activitiesResponse.json()
        
        setStats(statsData.data)
        setAllActivities(activitiesData.data || [])
        setActivities(activitiesData.data || [])
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
        setError('Não foi possível carregar os dados do dashboard.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="grid gap-4 lg:gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Cards de resumo - Agora com ação de filtro */}
        <div 
          className={`bg-blue-100 p-4 lg:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${activeFilter === 'athletes' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleFilterChange('athletes')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total de Filiados</h3>
              {isLoading ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-gray-400">Carregando...</span>
                </div>
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {stats?.totalAthletes || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-green-100 p-4 lg:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${activeFilter === 'events' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => handleFilterChange('events')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Eventos Ativos</h3>
              {isLoading ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-gray-400">Carregando...</span>
                </div>
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {stats?.activeEvents || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-amber-50 p-4 lg:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${activeFilter === 'news' ? 'ring-2 ring-amber-500' : ''}`}
          onClick={() => handleFilterChange('news')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Notícias Publicadas</h3>
              {isLoading ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-gray-400">Carregando...</span>
                </div>
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {stats?.publishedNews || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-purple-100 p-4 lg:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${activeFilter === 'documents' ? 'ring-2 ring-purple-500' : ''}`}
          onClick={() => handleFilterChange('documents')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Documentos</h3>
              {isLoading ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-gray-400">Carregando...</span>
                </div>
              ) : (
                <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                  {stats?.documents || 0}
                </p>
              )}
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Área de atividades recentes */}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            {activeFilter === 'all' && 'Todas as Atividades Recentes'}
            {activeFilter === 'athletes' && 'Atividades de Filiação'}
            {activeFilter === 'events' && 'Atividades de Eventos'}
            {activeFilter === 'news' && 'Atividades de Notícias'}
            {activeFilter === 'documents' && 'Atividades de Documentos'}
          </h2>
          
          {activeFilter !== 'all' && (
            <button 
              onClick={() => handleFilterChange('all')} 
              className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar filtro
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-[#08285d]" />
            <span className="text-gray-500">Carregando atividades...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="border-l-2 border-[#08285d] pl-4">
            <p className="text-gray-600 text-sm">Nenhuma atividade recente.</p>
            <span className="text-xs text-gray-400 mt-1">Agora</span>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="border-l-2 border-[#08285d] pl-4">
                <p className="text-gray-800 text-sm font-medium">{activity.title}</p>
                <p className="text-gray-600 text-sm">{activity.description}</p>
                <span className="text-xs text-gray-400 mt-1 block">
                  {format(new Date(activity.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
