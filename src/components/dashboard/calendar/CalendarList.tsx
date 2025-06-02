'use client';

import React from 'react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/calendar/useCalendarEvents';
import Image from 'next/image';

// Função para processar URLs de imagens para usar o endpoint de proxy
const processImageUrl = (url: string | null): string => {
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

export default function CalendarList() {
  const { events, isLoading, isError } = useCalendarEvents();

  if (isLoading) return <div>Carregando eventos...</div>;
  if (isError) return <div>Erro ao carregar eventos.</div>;
  if (!events || events.length === 0) return <div>Nenhum evento encontrado.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Eventos do Calendário</h2>
      <ul className="space-y-4">
        {events.map((event: CalendarEvent) => (
          <li key={event.id} className="border rounded p-4 flex flex-col gap-2">
            <div className="flex items-center gap-4">
              {event.imageurl && (
                <div className="relative w-24 h-24 rounded overflow-hidden">
                  <Image 
                    src={processImageUrl(event.imageurl)} 
                    alt="Cartaz" 
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem do evento: ${event.title}`);
                      // Fallback para uma imagem padrão
                      e.currentTarget.src = '/images/placeholder-evento.jpg';
                    }}
                  />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg">{event.title}</h3>
                <div className="text-xs text-muted-foreground">{event.startdate && new Date(event.startdate).toLocaleString()} - {event.enddate && new Date(event.enddate).toLocaleString()}</div>
                <div className="text-sm">{event.city} / {event.uf}</div>
                <div className="text-sm">Modalidade: {event.modality} | Categoria: {event.category}</div>
                {event.highlight && <span className="inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs ml-2">Destaque</span>}
              </div>
            </div>
            <div className="mt-2">
              {event.description && <div className="mb-1 text-sm">{event.description}</div>}
              {event.website && <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Site/Redes Sociais</a>}
              {event.regulationpdf && (
                <a href={event.regulationpdf} target="_blank" rel="noopener noreferrer" className="ml-4 text-green-700 underline text-xs">Regulamento</a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
