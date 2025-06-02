'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

interface GoogleMapComponentProps {
  latitude?: number
  longitude?: number
  onChange?: (lat: number, lng: number) => void
  address?: string
  className?: string
  disabled?: boolean
}

export function GoogleMapComponent({
  latitude,
  longitude,
  onChange,
  address,
  className,
  disabled = false
}: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [searchAddress, setSearchAddress] = useState(address || '')
  const [isSearching, setIsSearching] = useState(false)
  
  const defaultCenter = useMemo(() => ({
    lat: latitude || -15.7801,  // Centro do Brasil por padrão
    lng: longitude || -47.9292
  }), [latitude, longitude])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Atualiza o marcador quando as coordenadas mudam
  useEffect(() => {
    if (map && (latitude && longitude)) {
      const position = { lat: latitude, lng: longitude }
      
      if (marker) {
        marker.setPosition(position)
      } else {
        const newMarker = new google.maps.Marker({
          position,
          map,
          draggable: !disabled
        })
        
        if (!disabled) {
          newMarker.addListener('dragend', () => {
            const newPosition = newMarker.getPosition()
            if (newPosition && onChange) {
              onChange(newPosition.lat(), newPosition.lng())
            }
          })
        }
        
        setMarker(newMarker)
      }
      
      map.panTo(position)
    }
  }, [map, latitude, longitude, marker, onChange, disabled])

  // Função para buscar endereço
  const searchForAddress = useCallback(() => {
    if (!map || !searchAddress) return
    
    setIsSearching(true)
    
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      setIsSearching(false)
      
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location
        
        if (onChange) {
          onChange(location.lat(), location.lng())
        }
        
        map.panTo(location)
        map.setZoom(15)
      } else {
        console.error('Geocode falhou:', status)
        alert('Não foi possível encontrar o endereço. Tente ser mais específico.')
      }
    })
  }, [map, searchAddress, onChange])

  // Função para adicionar marcador ao clicar no mapa
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (disabled || !onChange) return
    
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    
    if (lat !== undefined && lng !== undefined) {
      onChange(lat, lng)
    }
  }, [onChange, disabled])

  // Adiciona o evento de clique ao mapa
  useEffect(() => {
    if (map && !disabled) {
      const clickListener = map.addListener('click', handleMapClick)
      return () => google.maps.event.removeListener(clickListener)
    }
  }, [map, handleMapClick, disabled])

  // Atualiza o endereço de busca quando o prop address muda
  useEffect(() => {
    if (address) {
      setSearchAddress(address)
    }
  }, [address])

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center p-6 border rounded-md bg-muted/20", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
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
          {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Buscar
        </Button>
      </div>
      
      <div className="relative border rounded-md overflow-hidden" style={{ height: '400px' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={defaultCenter}
          zoom={latitude && longitude ? 15 : 4}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            scrollwheel: !disabled,
            draggable: !disabled
          }}
        />
        
        {disabled && (
          <div className="absolute inset-0 bg-background/10" />
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {disabled 
          ? "Visualização do mapa apenas. Edite o evento para alterar a localização."
          : "Clique no mapa para definir a localização ou busque um endereço acima."}
      </p>
    </div>
  )
}
