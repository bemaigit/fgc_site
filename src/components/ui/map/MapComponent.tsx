'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet'
import L from 'leaflet'

// Componente para lidar com eventos do mapa
function MapEvents({ 
  onMapClick, 
  disabled 
}: { 
  onMapClick?: (lat: number, lng: number) => void, 
  disabled?: boolean 
}) {
  useMapEvents({
    click: (e) => {
      if (disabled || !onMapClick) return
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

// Corrigir o problema dos ícones do Leaflet no Next.js
function FixLeafletIcon() {
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/images/map/marker-icon-2x.png',
      iconUrl: '/images/map/marker-icon.png',
      shadowUrl: '/images/map/marker-shadow.png',
    })
  }, [])
  return null
}

interface MapComponentProps {
  position: [number, number] | null
  onMapClick?: (lat: number, lng: number) => void
  disabled?: boolean
  zoom?: number
  popupContent?: React.ReactNode
}

export default function MapComponent({
  position,
  onMapClick,
  disabled = false,
  zoom = 15,
  popupContent
}: MapComponentProps) {
  // Define o centro do mapa
  const center: [number, number] = position || [-15.7801, -47.9292] // Centro do Brasil por padrão
  
  return (
    <MapContainer
      center={center}
      zoom={position ? zoom : 4}
      style={{ height: '100%', width: '100%' }}
      key={position ? `${position[0]}-${position[1]}` : 'default'}
    >
      <FixLeafletIcon />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {position && (
        <Marker position={position}>
          {popupContent && <Popup>{popupContent}</Popup>}
        </Marker>
      )}
      
      <MapEvents onMapClick={onMapClick} disabled={disabled} />
    </MapContainer>
  )
}
