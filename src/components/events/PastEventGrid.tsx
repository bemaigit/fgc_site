'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/date'
import useSWR from 'swr'
import Image from 'next/image'
import { CalendarCheck, Clock, FileText } from 'lucide-react'
import { processEventImageUrl } from '@/lib/processEventImageUrl'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  coverImage?: string
  posterImage?: string
  published: boolean
  resultsFile?: string
}

// Fetcher personalizado para garantir o correto funcionamento
const fetcher = async (url: string) => {
  console.log('Fazendo requisição para:', url)
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Erro ao buscar dados')
    console.error('Resposta da API:', await res.text())
    throw error
  }
  return res.json()
}

export function PastEventGrid() {
  const router = useRouter()
  const { data: events = [], isLoading, error } = useSWR<Event[]>('/api/events?public=true&past=true', fetcher)

  // Log para debug
  useEffect(() => {
    if (error) {
      console.error('Erro ao carregar eventos passados:', error)
    }
    if (events.length === 0 && !isLoading) {
      console.log('Nenhum evento passado encontrado ou retornado pela API')
    } else if (events.length > 0) {
      console.log('Eventos passados carregados:', events)
    }
  }, [events, isLoading, error])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-36 sm:h-48 bg-gray-200 rounded-t-lg" />
            <CardContent className="p-3 sm:p-4">
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {events.length === 0 && !isLoading ? (
        <div className="col-span-3 text-center py-12">
          <h3 className="text-lg font-medium text-gray-500">Nenhum evento passado disponível</h3>
          <p className="mt-2 text-gray-400">Não foram encontrados registros de eventos anteriores.</p>
        </div>
      ) : (
        events.map((event) => (
          <Card key={event.id} className="overflow-hidden bg-white hover:shadow-md transition-shadow">
            {event.posterImage && (
              <div className="relative h-36 sm:h-48">
                <div className="absolute top-0 right-0 bg-gray-800/80 text-white text-xs px-2 py-1 m-2 rounded-md">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Realizado</span>
                  </div>
                </div>
                <Image
                  src={processEventImageUrl(event.posterImage)}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
            <CardContent className="p-3 sm:p-4 flex flex-col h-auto sm:h-64">
              <div className="flex-grow">
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2">{event.description}</p>
                <div className="text-xs sm:text-sm text-gray-500 flex items-center mb-1">
                  <CalendarCheck className="h-3.5 w-3.5 mr-1 text-gray-400" />
                  <span>Realizado em: {formatDate(event.startDate)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/eventos/${event.id}`)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  Ver detalhes
                </Button>
                
                {event.resultsFile && (
                  <Button
                    onClick={() => window.open(event.resultsFile, '_blank')}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10 text-xs sm:text-sm py-1.5 sm:py-2"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Resultados do Evento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
