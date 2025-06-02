// Este é um componente de servidor
'use client'

import { EventEditClient } from './client'
import { useParams } from 'next/navigation'

// Definindo a função para seguir as recomendações do Next.js
export default function EventEditPage() {
  // Em um componente cliente, usamos o hook useParams() em vez de esperar props params
  const params = useParams()
  const eventId = params.id as string
  
  return <EventEditClient eventId={eventId} />
}