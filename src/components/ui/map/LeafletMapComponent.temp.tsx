'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Search, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Importar os estilos do Leaflet
import 'leaflet/dist/leaflet.css'

// Importar componentes do Leaflet dinamicamente para evitar problemas de SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Componente para lidar com eventos do mapa
const MapEvents = dynamic(
  () => import('react-leaflet').then((mod) => {
    // Componente interno para lidar com eventos
    const { useMapEvents } = mod
    return function MapEventsComponent({ 
      onClick, 
      disabled 
    }: { 
      onClick?: (lat: number, lng: number) => void, 
      disabled?: boolean 
    }) {
      useMapEvents({
        click: (e) => {
          if (disabled || !onClick) return
          onClick(e.latlng.lat, e.latlng.lng)
        }
      })
      return null
    }
  }),
  { ssr: false }
)

// Corrigir o problema dos ícones do Leaflet no Next.js
const FixLeafletIcon = dynamic(
  () => import('leaflet').then((L) => {
    return function FixLeafletIconComponent() {
      useEffect(() => {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/images/map/marker-icon-2x.png',
          iconUrl: '/images/map/marker-icon.png',
          shadowUrl: '/images/map/marker-shadow.png',
        })
        return () => {}
      }, [])
      return null
    }
  }),
  { ssr: false }
)

interface LeafletMapComponentProps {
  latitude?: number
  longitude?: number
  onChange?: (lat: number, lng: number) => void
  address?: string
  className?: string
  disabled?: boolean
  zoom?: number
  height?: string
  showSearchBar?: boolean
  popupContent?: React.ReactNode
}

export function LeafletMapComponent({
  latitude,
  longitude,
  onChange,
  address,
  className,
  disabled = false,
  zoom = 15,
  height = '400px',
  showSearchBar = true,
  popupContent
}: LeafletMapComponentProps) {
  const [searchAddress, setSearchAddress] = useState(address || '')
  const [isSearching, setIsSearching] = useState(false)
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  )
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<any>(null)
  
  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Atualiza a posição quando as props mudam
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
      
      // Se o mapa já estiver inicializado, centralize-o na nova posição
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], zoom)
      }
    }
  }, [latitude, longitude, zoom])
  
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
      const encodedAddress = encodeURIComponent(searchAddress)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        
        setPosition([lat, lon])
        
        if (onChange) {
          onChange(lat, lon)
        }
        
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], zoom)
        }
      } else {
        alert('Não foi possível encontrar o endereço. Tente ser mais específico.')
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error)
      alert('Erro ao buscar endereço. Verifique sua conexão e tente novamente.')
    } finally {
      setIsSearching(false)
    }
  }
  
  // Função para lidar com o clique no mapa
  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng])
    
    if (onChange) {
      onChange(lat, lng)
    }
  }
  
  // Define o centro do mapa
  const center: [number, number] = position || [-15.7801, -47.9292] // Centro do Brasil por padrão
  
  // Se não estamos no cliente, mostra um placeholder
  if (!isClient) {
    return (
      <div className={cn("space-y-2", className)}>
        {showSearchBar && (
          <div className="flex gap-2">
            <Input
              placeholder="Carregando mapa..."
              disabled={true}
              className="flex-1"
            />
            <Button 
              type="button" 
              disabled={true}
              variant="secondary"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscar
            </Button>
          </div>
        )}
        
        <div 
          className="flex items-center justify-center border rounded-md bg-muted/20" 
          style={{ height }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando mapa...</span>
        </div>
      </div>
    )
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
      
      <div className="relative border rounded-md overflow-hidden" style={{ height }}>
        <FixLeafletIcon />
        <MapContainer
          center={center}
          zoom={position ? zoom : 4}
          style={{ height: '100%', width: '100%' }}
          whenReady={(map) => {
            mapRef.current = map.target
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {position && (
            <Marker position={position}>
              {popupContent && <Popup>{popupContent}</Popup>}
            </Marker>
          )}
          
          <MapEvents onClick={handleMapClick} disabled={disabled} />
        </MapContainer>
        
        {disabled && (
          <div className="absolute inset-0 bg-background/10 pointer-events-none" />
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
