'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { ModalityEditor } from '@/components/dashboard/events/ModalityEditor'
import { EventModality } from '@/hooks/useEventModalities'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ModalityFormValues {
  id?: string
  name: string
  description: string
  active: boolean
}

export default function ModalitiesPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [modalityToEdit, setModalityToEdit] = useState<ModalityFormValues | undefined>()
  const [modalityToDelete, setModalityToDelete] = useState<EventModality | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Busca modalidades
  const { data: modalitiesResponse = { data: [] }, isLoading } = useQuery({
    queryKey: ['event-modalities'],
    queryFn: async () => {
      const res = await fetch('/api/events/modalities')
      if (!res.ok) throw new Error('Erro ao buscar modalidades')
      return res.json()
    }
  })

  // Extrair o array de modalidades da resposta
  const modalities = Array.isArray(modalitiesResponse) 
    ? modalitiesResponse 
    : (modalitiesResponse.data || []);

  // Mutação para criar/editar modalidade
  const { mutate: saveModality, isPending: isSaving } = useMutation({
    mutationFn: async (data: ModalityFormValues) => {
      const res = await fetch(`/api/events/modalities${data.id ? `/${data.id}` : ''}`, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Erro ao salvar modalidade')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: `Modalidade ${modalityToEdit?.id ? 'editada' : 'criada'} com sucesso`
      })
      queryClient.invalidateQueries({ queryKey: ['event-modalities'] })
      handleCloseEditor()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao ${modalityToEdit?.id ? 'editar' : 'criar'} modalidade: ${error.message}`
      })
    }
  })

  // Mutação para excluir modalidade
  const { mutate: deleteModality, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/modalities/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao excluir modalidade')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Modalidade excluída com sucesso'
      })
      queryClient.invalidateQueries({ queryKey: ['event-modalities'] })
      setModalityToDelete(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message
      })
      setModalityToDelete(null)
    }
  })

  // Handlers
  const handleOpenEditor = (modality?: EventModality) => {
    if (modality) {
      setModalityToEdit({
        id: modality.id,
        name: modality.name,
        description: modality.description || '',
        active: modality.active
      })
    } else {
      setModalityToEdit(undefined)
    }
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setModalityToEdit(undefined)
    setIsEditorOpen(false)
  }

  // Definição das colunas da tabela
  const columns: ColumnDef<EventModality>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => <div className="max-w-[300px] truncate">{row.original.description || '-'}</div>
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'default' : 'secondary'}>
          {row.original.active ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: ptBR })
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleOpenEditor(row.original)}
          >
            Editar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive/80"
            onClick={() => setModalityToDelete(row.original)}
          >
            Excluir
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold">Modalidades de Eventos</h1>
        <Button onClick={() => handleOpenEditor()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Modalidade
        </Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <p>Carregando modalidades...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={modalities} 
            emptyMessage="Nenhuma modalidade encontrada"
          />
        )}
      </div>

      <ModalityEditor
        isOpen={isEditorOpen}
        modality={modalityToEdit}
        isLoading={isSaving}
        onClose={handleCloseEditor}
        onSubmit={saveModality}
      />

      <AlertDialog open={!!modalityToDelete} onOpenChange={() => setModalityToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a modalidade "{modalityToDelete?.name}"? 
              Esta ação não poderá ser desfeita e pode afetar eventos e categorias relacionadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => modalityToDelete?.id && deleteModality(modalityToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
        <div className="flex">
          <div className="py-1"><svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
          <div>
            <p className="font-bold">Configuração de Modalidades por Gênero</p>
            <p className="text-sm">Após criar as modalidades, acesse <a href="/dashboard/eventos/configuracoes" className="font-medium underline">Configurações de Eventos</a> para definir quais categorias estão disponíveis para cada combinação de modalidade e gênero.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
