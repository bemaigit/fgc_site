'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, ChevronRight, ChevronLeft } from 'lucide-react'
import { format, isAfter, isBefore, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { processCalendarBannerUrl } from '@/lib/processCalendarBannerUrl'

// Tipo de evento
interface CalendarEvent {
  id: string
  title: string
  startdate: string
  enddate: string
  city: string
  uf: string
  modality: string
  imageurl: string | null
  highlight: boolean
}

// NOTA: Agora usamos a função importada processCalendarBannerUrl em vez desta função local
// Função apenas para processar URLs de imagens de eventos (não para o banner principal)
const processEventImageUrl = (url: string | null): string => {
  if (!url) return '/images/placeholder-evento.jpg';
  
  // Se a URL já contém o endpoint de proxy, retorná-la como está
  if (url.includes('/api/calendar/image')) {
    return url;
  }
  
  // Processar o caminho para garantir compatibilidade com diferentes formatos
  let processedPath = url;
  
  // Caso 1: Se for uma URL completa, extrair apenas o caminho
  if (url.includes('://')) {
    try {
      const urlObj = new URL(url);
      processedPath = urlObj.pathname
        .replace(/^\/storage\//, '')
        .replace(/^\/fgc\//, '');
    } catch (error) {
      console.error('Erro ao processar URL da imagem:', error);
    }
  } 
  // Caso 2: Se começar com /storage/, remover esse prefixo
  else if (url.startsWith('/storage/')) {
    processedPath = url.substring(9); // Remove '/storage/'
  }
  // Caso 3: Se começar com /fgc/, remover esse prefixo
  else if (url.startsWith('/fgc/')) {
    processedPath = url.substring(5); // Remove '/fgc/'
  }
  
  // Se ainda não tem o prefixo calendario, adicionar
  if (!processedPath.startsWith('calendario/')) {
    const filename = processedPath.split('/').pop() || processedPath;
    processedPath = `calendario/${filename}`;
  }
  
  // Construir URL para o proxy de imagens
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  return `${baseUrl}/api/calendar/image?path=${encodeURIComponent(processedPath)}`;
};

export default function CalendarioDestaque() {
  const [eventos, setEventos] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  // Buscar o banner do calendário
  useEffect(() => {
    console.log('Iniciando busca do banner do calendário...');
    fetch('/api/banner/calendar')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar banner')
        return res.json()
      })
      .then(data => {
        console.log('Resposta completa da API:', data);
        if (data.bannerUrl) {
          console.log('Banner do calendário carregado da API:', data.bannerUrl);
          // Não processar a URL, a API já retorna a URL pronta para uso
          setBannerUrl(data.bannerUrl);
        } else {
          console.log('Nenhuma URL de banner encontrada, usando padrão');
        }
      })
      .catch(err => {
        console.error('Erro ao carregar banner:', err);
      })
  }, [])

  // Buscar eventos em destaque
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/calendar-event')
        if (!response.ok) {
          // Tentar extrair mensagem de erro detalhada
          let errorDetails = 'Erro ao carregar eventos';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorDetails = `${errorDetails}: ${errorData.error}`;
              if (errorData.details) {
                errorDetails = `${errorDetails} - ${errorData.details}`;
              }
            }
          } catch (parseError) {
            // Se não for possível extrair JSON, use o status
            errorDetails = `${errorDetails} (Status: ${response.status})`;
          }
          console.error('Erro detalhado:', errorDetails);
          throw new Error(errorDetails);
        }
        
        const eventosData = await response.json()
        
        // Filtrar para mostrar apenas eventos futuros ou acontecendo hoje
        const hoje = new Date()
        const proximosEventos = eventosData.filter((evento: CalendarEvent) => {
          const dataInicio = parseISO(evento.startdate)
          return isToday(dataInicio) || isAfter(dataInicio, hoje)
        })
        
        // Verificar se temos eventos futuros
        console.log(`[CalendarioDestaque] Encontrados ${proximosEventos.length} eventos futuros/hoje`);
        
        // Se não houver eventos futuros, incluir alguns eventos passados recentes
        let eventosParaExibir = [...proximosEventos];
        if (proximosEventos.length === 0 && eventosData.length > 0) {
          // Ordenar eventos passados por data (do mais recente para o mais antigo)
          const eventoPassados = eventosData
            .filter((evento: CalendarEvent) => {
              const dataInicio = parseISO(evento.startdate)
              return isBefore(dataInicio, hoje) && !isToday(dataInicio)
            })
            .sort((a: CalendarEvent, b: CalendarEvent) => {
              // Ordenar do mais recente para o mais antigo
              return new Date(b.startdate).getTime() - new Date(a.startdate).getTime()
            })
          
          // Pegar os 3 eventos mais recentes
          eventosParaExibir = eventoPassados.slice(0, 3);
          console.log(`[CalendarioDestaque] Usando ${eventosParaExibir.length} eventos passados recentes como fallback`);
        }
        
        // Ordenar por data (os mais próximos primeiro) e priorizar eventos em destaque
        const eventosOrdenados = eventosParaExibir.sort((a: CalendarEvent, b: CalendarEvent) => {
          // Priorizar eventos em destaque
          if (a.highlight && !b.highlight) return -1
          if (!a.highlight && b.highlight) return 1
          
          // Depois ordenar por data (do mais próximo ao mais distante)
          return new Date(a.startdate).getTime() - new Date(b.startdate).getTime()
        })
        
        // Pegar apenas os 3 primeiros eventos
        setEventos(eventosOrdenados.slice(0, 3))
      } catch (err) {
        console.error('Erro ao buscar eventos:', err)
        setError('Não foi possível carregar os eventos')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEventos()
  }, [])
  
  // Formatar data no estilo "12 fev 2024"
  const formatarData = (dataString: string) => {
    const data = parseISO(dataString)
    return format(data, "dd MMM", { locale: ptBR }).toLowerCase()
  }
  
  // Exibir estado de carregamento
  if (isLoading) {
    return (
      <div>
        {/* Banner do Calendário - versão loading */}
        <div className="relative h-[300px] md:h-[350px] bg-black rounded-lg overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(8,40,93,0.5)]"></div>
            <div className="animate-pulse w-full h-full bg-gray-700/60"></div>
          </div>
          <div className="relative h-full flex flex-col items-center justify-center text-white">
            <div className="h-10 w-48 animate-pulse bg-gray-200/30 rounded mb-4"></div>
            <div className="h-8 w-32 animate-pulse bg-gray-200/30 rounded"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 mb-4">
          <h2 className="text-xl font-bold text-[#08285d]">Próximos Eventos</h2>
          <div className="h-6 animate-pulse bg-gray-200 rounded w-24"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white p-3 rounded-md border border-gray-200 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  // Exibir mensagem de erro
  if (error) {
    return (
      <div>
        {/* Banner do Calendário - versão erro */}
        <div className="relative h-[300px] md:h-[350px] bg-black rounded-lg overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(8,40,93,0.9)]"></div>
            <Image 
              src="/images/banner-calendario-default.jpg" 
              alt="Calendário da Federação Goiana de Ciclismo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative h-full flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">CALENDÁRIO</h1>
            <Link 
              href="/calendario" 
              className="px-4 py-2 bg-[#7db0de] hover:bg-[#08285d] text-white rounded transition-colors text-sm font-medium"
            >
              Ver todos os eventos
            </Link>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 mb-4">
          <h2 className="text-xl font-bold text-[#08285d]">Próximos Eventos</h2>
          <Link 
            href="/calendario" 
            className="text-sm text-[#7db0de] hover:text-[#08285d] flex items-center"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="p-4 text-center text-gray-500">
          <p>{error}</p>
        </div>
      </div>
    )
  }
  
  // Não há eventos
  if (eventos.length === 0) {
    return (
      <div>
        {/* Banner do Calendário - com proporção mais responsiva */}
        <div className="relative w-full overflow-hidden rounded-lg">
          {/* Container com proporção fixa para manter relação de aspecto */}
          <div className="w-full h-0 pb-[36%] sm:pb-[33%] md:pb-[30%] relative">
            <div className="absolute inset-0 bg-black">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(8,40,93,0.9)]"></div>
              <Image 
                src={bannerUrl || `/api/banner/calendar/image?path=default.jpg`}
                onError={(e) => {
                  console.error('Erro ao carregar imagem do banner do calendário:', {
                    url: (e.target as HTMLImageElement).src
                  });
                  // Se falhar, usar a imagem de fallback diretamente
                  (e.target as HTMLImageElement).src = `/api/banner/calendar/image?path=default.jpg`;
                }} 
                alt="Calendário da Federação Goiana de Ciclismo"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 sm:pb-8 md:pb-12 lg:pb-16 text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 lg:mb-4">CALENDÁRIO</h1>
              <Link 
                href="/calendario" 
                className="px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 lg:px-5 lg:py-2 bg-[#7db0de] hover:bg-[#08285d] text-white rounded transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-medium"
              >
                Ver todos os eventos
              </Link>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 mb-4">
          <h2 className="text-xl font-bold text-[#08285d]">Próximos Eventos</h2>
          <Link 
            href="/calendario" 
            className="text-sm text-[#7db0de] hover:text-[#08285d] flex items-center"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="p-4 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Nenhum evento programado</p>
        </div>
      </div>
    )
  }
  
  return (
    <div>
      {/* Banner do Calendário - com proporção mais responsiva */}
      <div className="relative w-full overflow-hidden rounded-lg">
        {/* Container com proporção fixa para manter relação de aspecto */}
        <div className="w-full h-0 pb-[36%] sm:pb-[33%] md:pb-[30%] relative">
          <div className="absolute inset-0 bg-black">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(8,40,93,0.9)]"></div>
            <Image 
              src={bannerUrl || '/images/banner-calendario-default.jpg'} 
              alt="Calendário da Federação Goiana de Ciclismo"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 sm:pb-8 md:pb-12 lg:pb-16 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 sm:mb-3 lg:mb-4">CALENDÁRIO</h1>
            <Link 
              href="/calendario" 
              className="px-2.5 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 lg:px-5 lg:py-2 bg-[#7db0de] hover:bg-[#08285d] text-white rounded transition-colors text-[10px] sm:text-xs md:text-sm lg:text-base font-medium"
            >
              Ver todos os eventos
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6 mb-4">
        <h2 className="text-xl font-bold text-[#08285d]">Próximos Eventos</h2>
        <Link 
          href="/calendario" 
          className="text-sm text-[#7db0de] hover:text-[#08285d] flex items-center"
        >
          Ver todos <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      {/* Carrossel horizontal substituindo o grid */}
      <div className="relative group touch-pan-x">
        {/* Container com scroll horizontal */}
        <div 
          id="calendario-destaque-slider"
          className="
            overflow-x-auto
            scrollbar-hide
            snap-x
            snap-mandatory
            grid
            grid-flow-col
            auto-cols-[calc(50%-0.5rem)]
            sm:auto-cols-[calc(33.333%-0.75rem)]
            md:auto-cols-[calc(25%-0.75rem)]
            gap-3
            pb-2
          "
        >
          {eventos.map((evento) => (
            <div key={evento.id} className="snap-start pl-4 first:pl-0">
              <Link 
                href={`/calendario/evento/${evento.id}`}
                className="bg-white rounded-md border border-gray-200 transition hover:shadow-md overflow-hidden flex flex-col h-full text-sm block"
              >
                {/* Imagem/banner do evento - altura reduzida */}
                <div className="relative w-full h-0 pb-[40%] bg-gray-200 overflow-hidden">
                  {evento.imageurl ? (
                    <Image 
                      src={processEventImageUrl(evento.imageurl)} 
                      alt={evento.title} 
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className="object-cover"
                      quality={80}
                      onError={(e) => {
                        console.error(`Erro ao carregar imagem do evento: ${evento.title}`, {
                          url: (e.target as HTMLImageElement).src
                        });
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#08285d] to-[#7db0de] text-white text-xs font-medium">
                      {evento.modality.substring(0, 3)}
                    </div>
                  )}
                  
                  {/* Tag de destaque - menor */}
                  {evento.highlight && (
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white text-[10px] px-1 py-0.5 rounded">
                      Destaque
                    </div>
                  )}
                </div>
                
                {/* Informações do evento - mais compactas */}
                <div className="p-2 flex-1 flex flex-col">
                  <h3 className="font-medium text-xs text-gray-900 line-clamp-2 mb-1">{evento.title}</h3>
                  
                  <div className="mt-auto flex flex-col text-xs">
                    <div className="flex items-center text-gray-600 mb-0.5">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0 text-[#08285d]" />
                      <span className="truncate">{formatarData(evento.startdate)}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-[#08285d]" />
                      <span className="truncate">{evento.city}/{evento.uf}</span>
                    </div>
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
            const container = document.querySelector('#calendario-destaque-slider') as HTMLElement;
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
            const container = document.querySelector('#calendario-destaque-slider') as HTMLElement;
            if (container) {
              container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
            }
          }}
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
