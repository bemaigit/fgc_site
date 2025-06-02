'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventFilters } from '@/components/dashboard/events/EventFilters'
import { EventList } from '@/components/dashboard/events/EventList'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Interface correspondente ao EventList
interface EventItem {
  id: string
  title: string
  startDate: Date | null
  status: string
  modality?: string
  category?: string
}

export default function EventsPage() {
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null)
  const [filters, setFilters] = useState({
    modality: '',
    category: '',
    gender: '',
    eventStatus: 'upcoming' // Por padrão, mostrar apenas eventos próximos
  })

  const { toast } = useToast()

  // Busca eventos com filtros
  const { data: eventsData = [], refetch, isLoading } = useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      
      // Aplicar filtro de status do evento (próximos/finalizados)
      if (filters.eventStatus === 'upcoming') {
        searchParams.append('past', 'false') // Eventos futuros
      } else if (filters.eventStatus === 'finished') {
        searchParams.append('past', 'true') // Eventos passados/finalizados
      } else {
        searchParams.append('all', 'true') // Todos os eventos
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        // Não adicionar o eventStatus como parâmetro de URL, pois já foi tratado acima
        if (key !== 'eventStatus' && value && value !== 'all') {
          searchParams.append(key, value)
        }
      })
      
      const res = await fetch(`/api/events?${searchParams}`)
      if (!res.ok) throw new Error('Erro ao buscar eventos')
      return res.json() as Promise<EventItem[]>
    }
  })

  // Mutação para excluir evento
  const { mutate: deleteEvent, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir evento')
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Evento excluído com sucesso'
      })
      refetch()
      setEventToDelete(null)
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir evento'
      })
    }
  })

  // Mutação para alternar status de publicação do evento
  const { mutate: togglePublishEvent, isPending: isTogglingPublish } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}/publish`, { 
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao alterar status de publicação');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sucesso',
        description: data.message || 'Status de publicação alterado com sucesso'
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao alterar status de publicação'
      });
    }
  });

  // Handlers com useCallback para evitar recriações desnecessárias
  const handleFilterChange = useCallback((filter: string, value: string) => {
    setFilters(prev => {
      // Se o valor for igual ao atual, não atualizar o estado
      if (prev[filter as keyof typeof prev] === value) {
        return prev;
      }
      return { ...prev, [filter]: value };
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      modality: '',
      category: '',
      gender: '',
      eventStatus: 'upcoming'
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    const event = eventsData.find(e => e.id === id);
    if (event) {
      setEventToDelete(event);
    }
  }, [eventsData]);

  const handleViewRegistrations = useCallback((id: string) => {
    window.location.href = `/dashboard/eventos/${id}/inscricoes`;
  }, []);

  const confirmDelete = useCallback(() => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
    }
  }, [eventToDelete, deleteEvent]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Eventos</h1>
        <Link href="/dashboard/eventos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <EventFilters 
          modality={filters.modality}
          category={filters.category}
          gender={filters.gender}
          eventStatus={filters.eventStatus}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className="mt-6">
        <EventList
          events={eventsData}
          isLoading={isLoading}
          onEdit={(id) => window.location.href = `/dashboard/eventos/${id}`}
          onDelete={handleDelete}
          onViewRegistrations={handleViewRegistrations}
          onTogglePublish={togglePublishEvent}
        />
      </div>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento &quot;{eventToDelete?.title}&quot;? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
