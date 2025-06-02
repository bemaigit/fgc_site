'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, FileText, Users, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GoogleMapComponent } from "@/components/ui/map/GoogleMapComponent"
import { processEventImageUrl } from "@/lib/processEventImageUrl"
import { processEventDocumentUrl } from '@/lib/processEventDocumentUrl'

interface EventHeaderProps {
  title: string
  startDate: Date
  endDate: Date | null
  location: string
  locationUrl?: string
  posterImage?: string
  coverImage?: string
  regulationPdf?: string | null
  resultsFile?: string | null
  latitude?: number
  longitude?: number
  eventId: string
  regulationText?: string
}

// A função formatImagePath foi substituída pela função processEventImageUrl importada

export function EventHeader({ 
  title, 
  startDate, 
  endDate, 
  location, 
  locationUrl,
  posterImage,
  coverImage,
  regulationPdf,
  resultsFile,
  latitude,
  longitude,
  eventId,
  regulationText
}: EventHeaderProps) {
  const [showMap, setShowMap] = useState(false)
  const [showRegulation, setShowRegulation] = useState(false)
  
  // Verificar se o evento tem coordenadas
  const hasCoordinates = !!(latitude && longitude)
  
  // Verificar se o evento tem link do Google Maps
  const hasLocationUrl = !!locationUrl
  
  // Determinar o comportamento do clique no ícone de localização
  const handleLocationClick = () => {
    if (hasLocationUrl) {
      // Abrir o link do Google Maps em uma nova aba
      window.open(locationUrl, '_blank', 'noopener,noreferrer')
    } else if (hasCoordinates) {
      // Mostrar o modal com o mapa (comportamento atual)
      setShowMap(true)
    }
  }

  return (
    <div className="bg-white">
      {/* Botão de voltar */}
      <div className="container mx-auto p-4">
        <Link href="/eventos">
          <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
      
      {/* Imagem do evento sem sobreposição de texto */}
      <div className="relative bg-gray-100">
        {coverImage ? (
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <Image
              src={processEventImageUrl(coverImage)}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : posterImage ? (
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            <Image
              src={processEventImageUrl(posterImage)}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="relative w-full h-[40vh] flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-lg">Sem imagem</span>
          </div>
        )}
      </div>
      
      {/* Espaçamento maior entre a imagem e o conteúdo */}
      <div className="h-12"></div>
      
      {/* Informações do evento abaixo da imagem */}
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {title}
          </h1>
          
          <div className="flex flex-wrap gap-2">
            {regulationPdf ? (
              <a 
                href={processEventDocumentUrl(regulationPdf, 'regulation')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  <FileText className="h-5 w-5" />
                  Regulamento
                </Button>
              </a>
            ) : (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowRegulation(true)}
              >
                <FileText className="h-5 w-5" />
                Regulamento
              </Button>
            )}
            
            {resultsFile && (
              <a 
                href={processEventImageUrl(resultsFile)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  <Award className="h-5 w-5" />
                  Resultados
                </Button>
              </a>
            )}
            
            <Link href={`/eventos/${eventId}/atletas-inscritos`}>
              <Button variant="outline" className="gap-2">
                <Users className="h-5 w-5" />
                Atletas inscritos
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span>
              {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              {endDate && ` - ${format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin 
              className={`h-5 w-5 text-green-600 ${(hasCoordinates || hasLocationUrl) ? "cursor-pointer hover:text-green-800" : ""}`} 
              onClick={handleLocationClick}
            />
            <span 
              className={(hasCoordinates || hasLocationUrl) ? "cursor-pointer hover:underline" : ""} 
              onClick={handleLocationClick}
            >
              {location}
            </span>
          </div>
        </div>
      </div>
      
      {/* Modal do mapa */}
      {hasCoordinates && (
        <Dialog open={showMap} onOpenChange={setShowMap}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Localização do Evento</DialogTitle>
            </DialogHeader>
            <div className="h-[400px] w-full">
              <GoogleMapComponent 
                latitude={latitude}
                longitude={longitude}
                disabled={true}
                address={location}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal do regulamento em texto */}
      <Dialog open={showRegulation} onOpenChange={setShowRegulation}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Regulamento do Evento</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none mt-4">
            {/* Usar dangerouslySetInnerHTML apenas se regulationText estiver disponível */}
            {regulationText ? (
              <div dangerouslySetInnerHTML={{ __html: regulationText }} />
            ) : (
              <p>Regulamento não disponível</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
