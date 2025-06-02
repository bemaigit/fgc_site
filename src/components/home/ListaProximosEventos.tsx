'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { format, parseISO, isAfter, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tipo de evento
interface CalendarEvent {
  id: string
  title: string
  startdate: string
  enddate: string
  city: string
  uf: string
  modality: string
  highlight: boolean
}

// Função para gerar cor baseada na modalidade
const getModalityColor = (modality: string): string => {
  // Mapa de cores para modalidades comuns
  const colorMap: Record<string, string> = {
    'MTB': '#3b82f6', // Azul
    'Road': '#2563eb', // Azul escuro
    'Ciclismo de Estrada': '#2563eb', // Azul escuro
    'Pista': '#ef4444', // Vermelho
    'BMX': '#f97316', // Laranja
    'Ciclocross': '#84cc16', // Verde
    'Gravel': '#8b5cf6', // Roxo
    'XCO': '#06b6d4', // Ciano
    'XCM': '#0ea5e9', // Azul claro
    'Downhill': '#f43f5e', // Rosa
    'Track': '#dc2626', // Vermelho escuro
    'Cyclocross': '#65a30d', // Verde escuro
  }
  
  // Retorna a cor mapeada ou um azul padrão
  return colorMap[modality] || '#3b82f6'
}

export default function ListaProximosEventos() {
  const [eventos, setEventos] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Buscar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/calendar-event')
        if (!response.ok) throw new Error('Erro ao carregar eventos')
        
        const eventosData = await response.json()
        
        // Filtrar para mostrar apenas eventos futuros ou acontecendo hoje
        const hoje = new Date()
        const proximosEventos = eventosData.filter((evento: CalendarEvent) => {
          const dataInicio = parseISO(evento.startdate)
          return isToday(dataInicio) || isAfter(dataInicio, hoje)
        })
        
        // Ordenar por data (os mais próximos primeiro)
        const eventosOrdenados = proximosEventos.sort((a: CalendarEvent, b: CalendarEvent) => {
          return new Date(a.startdate).getTime() - new Date(b.startdate).getTime()
        })
        
        // Pegar apenas os 5 primeiros eventos
        setEventos(eventosOrdenados.slice(0, 5))
      } catch (err) {
        console.error('Erro ao buscar eventos:', err)
        setError('Não foi possível carregar os eventos')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEventos()
  }, [])

  // Formatar intervalo de datas no estilo "12 Abr - 20 Abr 2025"
  const formatarIntervaloData = (dataInicio: string, dataFim: string) => {
    const inicio = parseISO(dataInicio)
    const fim = parseISO(dataFim)
    
    // Se as datas são no mesmo ano
    if (inicio.getFullYear() === fim.getFullYear()) {
      // Se as datas são no mesmo mês
      if (inicio.getMonth() === fim.getMonth()) {
        // Se as datas são no mesmo dia
        if (inicio.getDate() === fim.getDate()) {
          return format(inicio, "dd MMM yyyy", { locale: ptBR })
        }
        // Mesmo mês, dias diferentes
        return `${format(inicio, "dd", { locale: ptBR })} - ${format(fim, "dd MMM yyyy", { locale: ptBR })}`
      }
      // Meses diferentes, mesmo ano
      return `${format(inicio, "dd MMM", { locale: ptBR })} - ${format(fim, "dd MMM yyyy", { locale: ptBR })}`
    }
    // Anos diferentes
    return `${format(inicio, "dd MMM yyyy", { locale: ptBR })} - ${format(fim, "dd MMM yyyy", { locale: ptBR })}`
  }
  
  // Exibir estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(index => (
          <div key={index} className="animate-pulse flex items-start">
            <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center mr-4">
              <div className="h-6 w-6 bg-blue-200 rounded"></div>
            </div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Exibir mensagem de erro
  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500">
        <p>{error}</p>
      </div>
    )
  }
  
  // Não há eventos
  if (eventos.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md">
        <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Nenhum evento programado</p>
      </div>
    )
  }
  
  return (
    <div className="relative group touch-pan-x">
      {/* Container com scroll horizontal */}
      <div
        ref={scrollContainerRef}
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
        {eventos.map((evento, index) => (
          <div key={evento.id} className="snap-start pl-4 first:pl-0">
            <Link 
              href={`/calendario/evento/${evento.id}`} 
              className="block hover:bg-gray-50 transition rounded-md overflow-hidden shadow-sm border border-gray-100 h-full"
            >
              <div className="flex items-start p-3">
                <div className="w-10 flex-shrink-0 flex items-center justify-center mr-3">
                  <span className="text-xl font-bold text-[#0068c9]">{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 uppercase text-sm sm:text-base line-clamp-2">
                    {evento.title}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-600 mt-1 gap-y-1 sm:gap-x-3">
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{evento.city}/{evento.uf}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{formatarIntervaloData(evento.startdate, evento.enddate)}</span>
                    </div>
                  </div>
                  
                  <div 
                    className="h-1 mt-3 rounded-full" 
                    style={{ backgroundColor: getModalityColor(evento.modality) }}
                  ></div>
                </div>
              </div>
            </Link>
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
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: 'smooth' });
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
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: 'smooth' });
          }
        }}
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
      
      <div className="pt-4 text-right">
        <Link 
          href="/calendario" 
          className="inline-flex items-center text-sm text-[#0068c9] hover:text-[#005091] font-medium"
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  )
}
