'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Tag, Award, Link as LinkIcon, Info, Flag, Download, Edit, Trash } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { use } from 'react'

interface CalendarEvent {
  id: string
  title: string
  description: string
  startdate: string
  enddate: string
  modality: string
  category: string
  city: string
  uf: string
  status: string
  website: string
  highlight: boolean
  imageurl?: string
  regulationpdf?: string
}

// Tipo seguro para params
interface EventoParams {
  id: string;
}

export default function ViewCalendarEventPage({ params }: { params: EventoParams | Promise<EventoParams> }) {
  const router = useRouter()
  
  // Extrair o ID com segurança de tipo
  const eventId = params instanceof Promise ? use(params).id : params.id
  
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Carregar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/calendar-event/${eventId}`)
        if (!response.ok) throw new Error('Erro ao carregar dados do evento')
        
        const eventData = await response.json()
        setEvent(eventData)
        setIsLoading(false)
      } catch (err) {
        console.error('Erro ao carregar evento:', err)
        setError('Não foi possível carregar os dados do evento')
        setIsLoading(false)
      }
    }
    
    fetchEvent()
  }, [eventId])
  
  // Formatação de datas
  const formatEventDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    } catch (e) {
      return 'Data inválida'
    }
  }
  
  // Deletar evento
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/calendar-event/${eventId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erro ao excluir evento')
      
      alert('Evento excluído com sucesso!')
      router.push('/dashboard/calendario')
    } catch (err) {
      console.error('Erro ao excluir:', err)
      setError('Não foi possível excluir o evento')
      setIsDeleting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loader h-12 w-12 border-4 border-t-[#08285d] border-[#e5e7eb] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do evento...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-2 text-sm text-red-700 underline"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  if (!event) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">Evento não encontrado.</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-2 text-sm text-yellow-700 underline"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/calendario')}
            className="text-[#08285d] hover:text-[#7db0de] p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Evento</h1>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/calendario/${eventId}`}
            className="py-2 px-4 flex items-center border border-[#08285d] rounded-md text-[#08285d] hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="py-2 px-4 flex items-center border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash className="h-4 w-4 mr-1" /> {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
      
      {/* Cabeçalho do evento com imagem */}
      <div className="bg-gray-100 rounded-lg shadow-md overflow-hidden border border-gray-300">
        <div className="bg-gray-200 px-6 py-4 flex items-center justify-between border-b border-gray-300">
          <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.status === 'Confirmado' ? 'bg-green-100 text-green-800' :
              event.status === 'Provisório' ? 'bg-yellow-100 text-yellow-800' :
              event.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
              event.status === 'Adiado' ? 'bg-purple-100 text-purple-800' :
              event.status === 'Concluído' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {event.status}
            </span>
            
            {event.highlight && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                <Flag className="h-3 w-3 mr-1" /> Destaque
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {/* Coluna da esquerda */}
          <div className="md:col-span-2 space-y-6">
            {/* Informações principais */}
            <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm space-y-4">
              <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Informações do Evento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Data de Início</p>
                    <p className="text-sm text-gray-600">{formatEventDate(event.startdate)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Data de Término</p>
                    <p className="text-sm text-gray-600">{formatEventDate(event.enddate)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Localização</p>
                  <p className="text-sm text-gray-600">{event.city}, {event.uf}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Tag className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Modalidade</p>
                    <p className="text-sm text-gray-600">{event.modality || 'Não informada'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Award className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Categoria</p>
                    <p className="text-sm text-gray-600">{event.category || 'Não informada'}</p>
                  </div>
                </div>
              </div>
              
              {event.website && (
                <div className="flex items-start">
                  <LinkIcon className="h-5 w-5 text-[#08285d] mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Website</p>
                    <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7db0de] hover:underline">
                      {event.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Descrição */}
            <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Descrição</h3>
              <div className="prose max-w-none">
                {event.description ? (
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma descrição disponível.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Coluna da direita */}
          <div className="space-y-6">
            {/* Imagem do evento */}
            {event.imageurl ? (
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Imagem do Evento</h3>
                <div className="flex justify-center">
                  <img 
                    src={event.imageurl} 
                    alt={`Cartaz do evento ${event.title}`} 
                    className="max-w-full h-auto rounded-md shadow-sm"
                  />
                </div>
              </div>
            ) : null}
            
            {/* Regulamento */}
            {event.regulationpdf ? (
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Regulamento</h3>
                <div className="flex flex-col items-center space-y-3">
                  <svg className="h-16 w-16 text-red-500" fill="currentColor" viewBox="0 0 384 512">
                    <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm250.2-143.7c-12.2-12-47-8.7-64.4-6.5-17.2-10.5-28.7-25-36.8-46.3 3.9-16.1 10.1-40.6 5.4-56-4.2-26.2-37.8-23.6-42.6-5.9-4.4 16.1-.4 38.5 7 67.1-10 23.9-24.9 56-35.4 74.4-20 10.3-47 26.2-51 46.2-3.3 15.8 26 55.2 76.1-31.2 22.4-7.4 46.8-16.5 68.4-20.1 18.9 10.2 41 17 55.8 17 25.5 0 28-28.2 17.5-38.7zm-198.1 77.8c5.1-13.7 24.5-29.5 30.4-35-19 30.3-30.4 35.7-30.4 35zm81.6-190.6c7.4 0 6.7 32.1 1.8 40.8-4.4-13.9-4.3-40.8-1.8-40.8zm-24.4 136.6c9.7-16.9 18-37 24.7-54.7 8.3 15.1 18.9 27.2 30.1 35.5-20.8 4.3-38.9 13.1-54.8 19.2zm131.6-5s-5 6-37.3-7.8c35.1-2.6 40.9 5.4 37.3 7.8z"></path>
                  </svg>
                  <a 
                    href={event.regulationpdf} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="py-2 px-4 bg-[#08285d] text-white rounded-md flex items-center hover:bg-[#7db0de] transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" /> Ver Regulamento
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
