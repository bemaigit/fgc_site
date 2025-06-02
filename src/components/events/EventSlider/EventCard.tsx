'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { processEventImageUrl } from '@/lib/processEventImageUrl'

interface EventCardProps {
  id: string
  title: string
  posterImage: string | null | undefined
  startDate: string | Date | null
  endDate: string | Date | null
  className?: string
}

// Função para formatar a data
const formatEventDate = (startDate: string | Date | null, endDate: string | Date | null): string => {
  if (!startDate) return 'Data não definida'

  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = endDate ? (typeof endDate === 'string' ? parseISO(endDate) : endDate) : null

    return `${format(start, "dd 'de' MMM", { locale: ptBR })} ${
      end ? `- ${format(end, "dd 'de' MMM", { locale: ptBR })}` : ''
    }`
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export function EventCard({ id, title, posterImage, startDate, endDate, className }: EventCardProps) {
  const formattedDate = formatEventDate(startDate, endDate)

  return (
    <Link href={`/eventos/${id}`}>
      <div
        className={cn(
          'group flex flex-col overflow-hidden rounded-2xl bg-white hover:shadow-lg transition-all duration-300 border-2 border-[#08285d] h-full',
          className
        )}
      >
        {/* Imagem do evento - Sem sobreposição de texto */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {posterImage ? (
            <Image
              src={processEventImageUrl(posterImage)}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Conteúdo abaixo da imagem */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Data */}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1 sm:mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">{formattedDate}</span>
          </div>

          {/* Título - Altura fixa para 2 linhas */}
          <div className="min-h-[2.5rem] sm:min-h-[3rem] mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </div>

          {/* Botão - Agora sempre alinhado */}
          <div className="mt-auto pt-1 sm:pt-2">
            <Button 
              variant="outline"
              size="sm"
              className="w-full gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors"
            >
              Saiba mais
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
