'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { PlusCircle, Pencil, Trash2 } from 'lucide-react'

interface ChampionshipEvent {
  id: string
  name: string
  year: number
  description?: string
  createdAt: string
  updatedAt: string
}

export default function EventosPage() {
  const router = useRouter()
  const [events, setEvents] = useState<ChampionshipEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<ChampionshipEvent | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/championships/events')
      if (!response.ok) {
        throw new Error('Erro ao buscar eventos')
      }
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      toast.error('Não foi possível carregar a lista de eventos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/championships/events?id=${eventToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir evento')
      }

      toast.success('Evento excluído com sucesso')
      fetchEvents()
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento. Por favor, tente novamente.')
    } finally {
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    }
  }

  const confirmDelete = (event: ChampionshipEvent) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Eventos</h1>

      <Tabs defaultValue="lista-eventos" className="mb-6">
        <TabsList>
          <TabsTrigger value="lista-eventos">Lista de Eventos</TabsTrigger>
          <TabsTrigger 
            value="criar-evento" 
            onClick={() => router.push('/dashboard/campeoes/eventos/criar')}
          >
            Adicionar Evento
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Eventos de Campeonato</h2>
        <Button onClick={() => router.push('/dashboard/campeoes/eventos/criar')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <p className="text-gray-500 mb-4">Nenhum evento cadastrado</p>
          <Button onClick={() => router.push('/dashboard/campeoes/eventos/criar')}>
            Criar Primeiro Evento
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>{event.year}</TableCell>
                  <TableCell>{event.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/campeoes/eventos/editar/${event.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento &quot;{eventToDelete?.name}&quot;?
              <br />
              <br />
              <strong className="text-destructive">
                Esta ação não pode ser desfeita e removerá todos os campeões associados a este evento.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
