'use client'

import { useState } from 'react'
import { Edit2, Trash2, Calendar, MapPin, Tag, Award, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CalendarEvent } from '@/hooks/calendar/useCalendarEvents'

interface CalendarTableProps {
  events: CalendarEvent[]
  onDelete: (id: string) => void
  isLoading?: boolean
}

export default function CalendarTable({ events, onDelete, isLoading = false }: CalendarTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleView = (id: string) => {
    router.push(`/dashboard/calendario/visualizar/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/calendario/${id}`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      setDeletingId(id)
      await onDelete(id)
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatLocation = (city: string, uf: string) => {
    if (!city && !uf) return '-'
    return `${city || ''}${city && uf ? '/' : ''}${uf || ''}`
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Local
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
        <p className="text-gray-500">Nenhum evento encontrado.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Imagem
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Evento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Local
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {event.imageurl ? (
                  <div className="h-10 w-10 rounded overflow-hidden">
                    <Image
                      src={event.imageurl}
                      alt={event.title}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                    Sem imagem
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{event.title}</span>
                  {event.highlight && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1 w-fit">
                      Destaque
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  <span>
                    {formatDate(event.startdate)} 
                    {event.enddate && event.enddate !== event.startdate 
                      ? ` a ${formatDate(event.enddate)}` 
                      : ''}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  {formatLocation(event.city, event.uf)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-1 text-gray-400" />
                    {event.modality || '-'}
                  </div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1 text-gray-400" />
                    {event.category || '-'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  className="text-[#08285d] hover:text-[#7db0de] inline-flex items-center mr-3"
                  onClick={() => handleView(event.id)}
                  title="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="text-[#08285d] hover:text-[#7db0de] inline-flex items-center mr-3"
                  onClick={() => handleEdit(event.id)}
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  className="text-red-600 hover:text-red-900 inline-flex items-center"
                  onClick={() => handleDelete(event.id)}
                  disabled={deletingId === event.id}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
