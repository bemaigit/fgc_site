'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Tag, Award, Info, Link as LinkIcon, Download, Share2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { use } from 'react'

// Tipo de evento
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

// Tipo seguro para params
interface EventoParams {
  id: string;
}

export default function EventoDetalhePage({ params }: { params: EventoParams | Promise<EventoParams> }) {
  const router = useRouter()
  
  // Extrair o ID com segurança de tipo
  const eventId = params instanceof Promise ? use(params).id : params.id
  
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Carregar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/calendar-event/${eventId}`)
        if (!response.ok) throw new Error('Erro ao carregar dados do evento')
        
        const eventData = await response.json()
        setEvent(eventData)
      } catch (err) {
        console.error('Erro ao carregar evento:', err)
        setError('Não foi possível carregar os dados do evento')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEvent()
  }, [eventId])
  
  // Formatação de datas
  const formatEventDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    } catch (e) {
      return 'Data inválida'
    }
  }
  
  // Obter cor do status
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
  
  // Compartilhar evento
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Evento da FGC',
        text: `Confira o evento "${event?.title}" da Federação Goiana de Ciclismo`,
        url: window.location.href,
      }).catch((error) => {
        console.log('Erro ao compartilhar:', error)
      })
    } else {
      // Fallback se a API Web Share não estiver disponível
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }
  
  // Renderizar carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="loader h-12 w-12 border-4 border-t-[#08285d] border-[#e5e7eb] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando detalhes do evento...</p>
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
              <button
                type="button"
                onClick={() => router.push('/calendario')}
                className="mt-2 text-sm text-red-700 underline"
              >
                Voltar para o calendário
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Renderizar evento não encontrado
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
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
                onClick={() => router.push('/calendario')}
                className="mt-2 text-sm text-yellow-700 underline"
              >
                Voltar para o calendário
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Botão de voltar e compartilhar */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/calendario')}
          className="flex items-center text-[#08285d] hover:text-[#7db0de] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Voltar para o calendário</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center text-[#08285d] hover:text-[#7db0de] transition-colors"
        >
          <Share2 className="h-5 w-5 mr-2" />
          <span>Compartilhar</span>
        </button>
      </div>
      
      {/* Cabeçalho do evento */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 mb-8">
        <div className="bg-[#08285d] text-white px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
            {event.highlight && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                Destaque
              </span>
            )}
          </div>
        </div>
        
        {/* Imagem do evento (se disponível) */}
        {event.imageurl && (
          <div className="relative h-80 w-full bg-gray-100">
            <Image
              src={event.imageurl}
              alt={event.title}
              fill
              className="object-contain"
            />
          </div>
        )}
        
        {/* Detalhes do evento */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna da esquerda com informações básicas */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Data de Início</p>
                      <p className="text-gray-600">{formatEventDate(event.startdate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Data de Término</p>
                      <p className="text-gray-600">{formatEventDate(event.enddate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Localização</p>
                      <p className="text-gray-600">{event.city}, {event.uf}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Tag className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Modalidade</p>
                      <p className="text-gray-600">{event.modality || 'Não informada'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">Categoria</p>
                      <p className="text-gray-600">{event.category || 'Não informada'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Links e recursos */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Links e Recursos</h2>
                
                <div className="space-y-4">
                  {event.website && (
                    <div className="flex items-start">
                      <LinkIcon className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700">Website Oficial</p>
                        <a 
                          href={event.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7db0de] hover:underline"
                        >
                          {event.website}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {event.regulationpdf && (
                    <div className="flex items-start">
                      <Download className="h-5 w-5 text-[#08285d] mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-700">Regulamento</p>
                        <a 
                          href={event.regulationpdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7db0de] hover:underline flex items-center"
                        >
                          Baixar regulamento do evento
                          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Coluna da direita com descrição */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição do Evento</h2>
              
              {event.description ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">Nenhuma descrição disponível para este evento.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mais eventos */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Voltar ao Calendário</h2>
        <Link 
          href="/calendario"
          className="inline-flex items-center bg-[#08285d] text-white px-4 py-2 rounded-md hover:bg-[#7db0de] transition-colors"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Ver todos os eventos
        </Link>
      </div>
    </div>
  )
}
