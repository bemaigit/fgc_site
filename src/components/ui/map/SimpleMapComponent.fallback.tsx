'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, MapPin, Plus, Minus, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
  const [mapError, setMapError] = useState(false)
  
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
  
  // Função para definir coordenadas manualmente
  const setManualCoordinates = () => {
    const latInput = prompt('Digite a latitude (ex: -15.7801):', position ? position[0].toString() : '')
    if (latInput === null) return
    
    const lngInput = prompt('Digite a longitude (ex: -47.9292):', position ? position[1].toString() : '')
    if (lngInput === null) return
    
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Coordenadas inválidas. Use apenas números e pontos decimais.')
      return
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Coordenadas fora dos limites válidos. Latitude deve estar entre -90 e 90, e longitude entre -180 e 180.')
      return
    }
    
    setPosition([lat, lng])
    
    if (onChange) {
      onChange(lat, lng)
    }
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
      >
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 p-4">
          {position ? (
            <>
              <Alert variant="warning" className="mb-4 w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Visualização do mapa indisponível</AlertTitle>
                <AlertDescription>
                  Não foi possível carregar o mapa, mas as coordenadas foram definidas. 
                  Você pode continuar com o cadastro do evento.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <p className="text-center font-medium">
                  Coordenadas definidas:
                </p>
                <p className="text-center text-muted-foreground">
                  Latitude: {position[0].toFixed(6)}
                </p>
                <p className="text-center text-muted-foreground">
                  Longitude: {position[1].toFixed(6)}
                </p>
              </div>
              
              {!disabled && (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    onClick={setManualCoordinates}
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Editar coordenadas
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={getCurrentLocation}
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Usar minha localização
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-center mb-4">
                Visualização do mapa indisponível. Defina a localização usando uma das opções abaixo.
              </p>
              
              {!disabled && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    onClick={getCurrentLocation}
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Usar minha localização
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={setManualCoordinates}
                    variant="outline"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Inserir coordenadas manualmente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        {disabled && (
          <div className="absolute inset-0 bg-background/10 pointer-events-none" />
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {disabled 
          ? "Visualização do mapa apenas. Edite o evento para alterar a localização."
          : position 
            ? `Coordenadas: ${position[0].toFixed(6)}, ${position[1].toFixed(6)}.`
            : "Busque um endereço ou use sua localização atual para definir o local do evento."}
      </p>
    </div>
  )
}
