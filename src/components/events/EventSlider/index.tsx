'use client'

import { useEffect, useRef, useState } from 'react'
import { EventCard } from './EventCard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ApiEvent } from '@/types/event'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  posterImage: string | null | undefined
  startDate: string | Date | null
  endDate: string | Date | null
}

interface EventSliderProps {
  className?: string
}

export function EventSlider({ className }: EventSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        console.log('Buscando eventos públicos...')
        const response = await fetch('/api/events?public=true&past=false')
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Resposta da API não ok:', errorData)
          throw new Error(errorData.error || 'Falha ao carregar eventos')
        }
        
        const data: ApiEvent[] = await response.json()
        console.log('Eventos recebidos:', data)
        
        // Mantém as datas como estão, sem tentar converter
        const eventsData = data.map((event) => ({
          id: event.id,
          title: event.title,
          posterImage: event.posterImage,
          startDate: event.startDate,
          endDate: event.endDate
        }))
        
        setEvents(eventsData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos'
        console.error('Erro detalhado:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth
    const scrollTo = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error}
      </div>
    )
  }

  if (!events.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum evento disponível no momento
      </div>
    )
  }

  return (
    <div className={cn("relative group touch-pan-x -mx-3 sm:-mx-0", className)}>
      {/* Botão Ver todos os Eventos - posicionado no topo */}
      <div className="flex justify-end items-center mb-4">
        <Link 
          href="/eventos" 
          className="text-sm text-[#08285d] hover:text-[#7db0de] flex items-center"
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="
          overflow-x-auto
          scrollbar-hide
          snap-x
          snap-mandatory
          grid
          grid-flow-col
          auto-cols-[calc(45%-0.5rem)]
          sm:auto-cols-[calc(45%-0.75rem)]
          md:auto-cols-[calc(33.333%-0.75rem)]
          lg:auto-cols-[calc(25%-0.75rem)]
          gap-3
          sm:gap-4
          pb-4
          -mb-4
          pl-3
          sm:pl-0
        "
      >
        {events.map((event) => (
          <div key={event.id} className="snap-start">
            <EventCard
              id={event.id}
              title={event.title}
              posterImage={event.posterImage}
              startDate={event.startDate}
              endDate={event.endDate}
            />
          </div>
        ))}
      </div>

      {/* Botões de navegação */}
      <div className="absolute inset-y-0 left-0 hidden md:flex items-center">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg -ml-4 border"
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-0 hidden md:flex items-center">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg -mr-4 border"
          onClick={() => handleScroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Remover as sombras indicativas */}
    </div>
  )
}
