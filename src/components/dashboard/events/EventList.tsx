'use client'

import { Button } from '@/components/ui/button'
import { FileEdit, Trash2, Loader2, Users, Eye, EyeOff } from 'lucide-react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface Event {
  id: string
  title: string
  startDate: Date | null
  status: string
  modality?: string | null
  category?: string | null
  published?: boolean
}

interface EventListProps {
  events?: Event[]
  isLoading?: boolean
  error?: string | null
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onViewRegistrations?: (id: string) => void
  onTogglePublish?: (id: string) => void
}

export function EventList({ 
  events = [], 
  isLoading,
  error,
  onEdit,
  onDelete,
  onViewRegistrations,
  onTogglePublish
}: EventListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Modalidade</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>
                {event.startDate 
                  ? format(new Date(event.startDate), 'dd/MM/yyyy')
                  : '-'
                }
              </TableCell>
              <TableCell>{event.modality || '-'}</TableCell>
              <TableCell>{event.category || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  {onTogglePublish && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onTogglePublish(event.id)}
                      className={event.published ? "text-green-600 hover:text-green-800" : "text-gray-400 hover:text-gray-600"}
                      title={event.published ? "Despublicar evento" : "Publicar evento"}
                    >
                      {event.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {onViewRegistrations && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewRegistrations(event.id)}
                    title="Ver inscrições"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(event.id)}
                    title="Editar evento"
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(event.id)}
                    title="Excluir evento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}

          {events.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum evento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
