'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, MapPin, Plus, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimpleMapComponentProps {
  latitude?: number
  longitude?: number
  onChange?: (lat: number, lng: number) => void
  address?: string
  className?: string
  disabled?: boolean
  zoom?: number
  height?: string
  showSearchBar?: boolean
}

export function SimpleMapComponent({
  latitude,
  longitude,
  onChange,
  address,
  className,
  disabled = false,
  zoom: initialZoom = 15,
  height = '400px',
  showSearchBar = true
}: SimpleMapComponentProps) {
  const [searchAddress, setSearchAddress] = useState(address || '')
  const [isSearching, setIsSearching] = useState(false)
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  )
  const [zoom, setZoom] = useState(initialZoom)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
  const [mapOffset, setMapOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  
  // Atualiza a posição quando as props mudam
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])
  
  // Atualiza o endereço de busca quando o prop address muda
  useEffect(() => {
    if (address) {
      setSearchAddress(address)
    }
  }, [address])
  
  // Função para buscar endereço usando OpenStreetMap Nominatim API
  const searchForAddress = async () => {
    if (!searchAddress) return
    
    setIsSearching(true)
    
    try {
      // Formatar o endereço para melhorar a busca no Brasil
      let formattedAddress = searchAddress
      
      // Adicionar "Brasil" ao final se não estiver presente
      if (!formattedAddress.toLowerCase().includes('brasil')) {
        formattedAddress += ', Brasil'
      }
      
      const encodedAddress = encodeURIComponent(formattedAddress)
      
      // Adicionar parâmetros para melhorar a busca
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodedAddress}&limit=1&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR,pt',
            'User-Agent': 'FGC-EventApp/1.0'
          }
        }
      )
      
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        
        setPosition([lat, lon])
        setMapOffset({ x: 0, y: 0 }) // Reset offset when searching
        
        if (onChange) {
          onChange(lat, lon)
        }
      } else {
        // Tentar uma busca mais genérica se a específica falhar
        const cityStateMatch = searchAddress.match(/([^,]+),\s*([^,]+)(?:,\s*([^,]+))?/)
        
        if (cityStateMatch) {
          // Extrair cidade e estado
          const city = cityStateMatch[1].trim()
          const state = cityStateMatch[2].trim()
          
          // Tentar buscar apenas pela cidade e estado
          const simplifiedAddress = `${city}, ${state}, Brasil`
          const encodedSimplifiedAddress = encodeURIComponent(simplifiedAddress)
          
          const fallbackResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodedSimplifiedAddress}&limit=1&countrycodes=br`,
            {
              headers: {
                'Accept-Language': 'pt-BR,pt',
                'User-Agent': 'FGC-EventApp/1.0'
              }
            }
          )
          
          const fallbackData = await fallbackResponse.json()
          
          if (fallbackData && fallbackData.length > 0) {
            const lat = parseFloat(fallbackData[0].lat)
            const lon = parseFloat(fallbackData[0].lon)
            
            setPosition([lat, lon])
            setMapOffset({ x: 0, y: 0 })
            
            if (onChange) {
              onChange(lat, lon)
            }
            
            alert('Endereço específico não encontrado. Mostrando a localização aproximada da cidade.')
          } else {
            alert('Não foi possível encontrar o endereço. Tente ser mais específico ou verifique se o endereço está correto.')
          }
        } else {
          alert('Não foi possível encontrar o endereço. Tente ser mais específico ou verifique se o endereço está correto.')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
      alert('Erro ao buscar endereço. Verifique sua conexão e tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }
  
  // Função para obter a localização atual do usuário
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setPosition([lat, lng])
          setMapOffset({ x: 0, y: 0 }) // Reset offset when getting current location
          
          if (onChange) {
            onChange(lat, lng)
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          alert('Não foi possível obter sua localização atual. Verifique as permissões do navegador.')
        }
      )
    } else {
      alert('Geolocalização não é suportada pelo seu navegador.')
    }
  }
  
  // Função para aumentar o zoom
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 19))
  }
  
  // Função para diminuir o zoom
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1))
  }
  
  // Função para iniciar o arrasto do mapa
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  
  // Função para arrastar o mapa
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return
    
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    
    setMapOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }))
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  
  // Função para finalizar o arrasto do mapa
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  // Função para lidar com o clique no mapa
  const handleMapClick = (e: React.MouseEvent) => {
    if (disabled || isDragging) return
    
    // Obter as dimensões e posição do elemento do mapa
    const mapElement = e.currentTarget as HTMLDivElement
    const rect = mapElement.getBoundingClientRect()
    
    // Calcular a posição relativa do clique no mapa (0-1)
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    if (!position) return
    
    // Calcular o deslocamento em graus com base no zoom
    const latRange = 360 / Math.pow(2, zoom)
    const lngRange = 360 / Math.pow(2, zoom)
    
    // Calcular a nova posição
    const centerLat = position[0]
    const centerLng = position[1]
    
    const newLat = centerLat - (y - 0.5) * latRange
    const newLng = centerLng + (x - 0.5) * lngRange
    
    setPosition([newLat, newLng])
    setMapOffset({ x: 0, y: 0 }) // Reset offset when clicking
    
    if (onChange) {
      onChange(newLat, newLng)
    }
  }
  
  // Gerar URL da imagem do mapa
  const getMapUrl = () => {
    if (!position) return ''
    
    const [lat, lng] = position
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=600x400&markers=${lat},${lng},red`
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {showSearchBar && (
        <div className="flex gap-2">
          <Input
            placeholder="Buscar endereço..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchForAddress()}
            disabled={disabled || isSearching}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={searchForAddress}
            disabled={disabled || isSearching || !searchAddress}
            variant="secondary"
          >
            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Buscar
          </Button>
        </div>
      )}
      
      <div 
        className="relative border rounded-md overflow-hidden"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
      >
        {position ? (
          <>
            <div 
              className="h-full w-full bg-cover bg-center cursor-move"
              style={{ 
                backgroundImage: `url("${getMapUrl()}")`,
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab'
              }}
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/20">
            <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              {disabled 
                ? "Nenhuma localização definida" 
                : "Clique no botão abaixo para usar sua localização atual ou busque um endereço acima."}
            </p>
            {!disabled && (
              <Button 
                type="button" 
                onClick={getCurrentLocation}
                variant="outline"
                className="mt-4"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Usar minha localização
              </Button>
            )}
          </div>
        )}
        
        {/* Controles de zoom */}
        {position && !disabled && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Button 
              type="button" 
              onClick={zoomIn}
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              onClick={zoomOut}
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {disabled && (
          <div className="absolute inset-0 bg-background/10 pointer-events-none" />
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {disabled 
          ? "Visualização do mapa apenas. Edite o evento para alterar a localização."
          : position 
            ? `Coordenadas: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}. Clique para ajustar a posição.`
            : "Busque um endereço ou use sua localização atual para definir o local do evento."}
      </p>
    </div>
  )
}
