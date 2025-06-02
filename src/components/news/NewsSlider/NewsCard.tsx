'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { processNewsImageUrl } from '@/lib/processNewsImageUrl'

interface NewsCardProps {
  id: string
  title: string
  coverImage: string | null
  excerpt: string | null
  publishedAt: string | Date | null
  className?: string
  slug?: string
}

// Função para formatar a data
const formatPublishedDate = (publishedAt: string | Date | null): string => {
  if (!publishedAt) return 'Data não definida'

  try {
    const date = typeof publishedAt === 'string' ? parseISO(publishedAt) : publishedAt
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Data inválida'
  }
}

export function NewsCard({ id, title, coverImage, excerpt, publishedAt, className, slug }: NewsCardProps) {
  const formattedDate = formatPublishedDate(publishedAt)

  return (
    <Link href={`/noticias/${slug || id}`}>
      <div
        className={cn(
          'group flex flex-col overflow-hidden rounded-2xl bg-white hover:shadow-lg transition-all duration-300 border-2 border-[#08285d] h-full',
          className
        )}
      >
        {/* Imagem da notícia */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {coverImage ? (
            <Image
              src={processNewsImageUrl(coverImage)}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={(e) => {
                console.error(`Erro ao carregar imagem da notícia: ${title}`);
                e.currentTarget.src = '/images/news-placeholder.jpg';
              }}
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
            <span className="text-xs sm:text-sm font-medium">Publicado em {formattedDate}</span>
          </div>

          {/* Título - Altura fixa para 2 linhas */}
          <div className="min-h-[2.5rem] sm:min-h-[3rem] mb-2 sm:mb-3">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </div>

          {/* Resumo - Altura fixa para 3 linhas */}
          {excerpt && (
            <div className="min-h-[3.5rem] mb-2">
              <p className="text-sm text-gray-600 line-clamp-3">
                {excerpt}
              </p>
            </div>
          )}

          {/* Botão - Alinhado na parte inferior */}
          <div className="mt-auto pt-1 sm:pt-2">
            <Button 
              variant="outline"
              size="sm"
              className="w-full gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors"
            >
              Ler mais
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
