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
import { CategoryEditor } from '@/components/dashboard/events/CategoryEditor'
import { EventCategory } from '@/hooks/useEventCategories'
import { EventModality } from '@/hooks/useEventModalities'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CategoryFormValues {
  id?: string
  name: string
  description: string
  modalityIds: string[]
  active: boolean
}

interface ExtendedEventCategory extends EventCategory {
  modalityIds: string[]
}

export default function CategoriesPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryFormValues | undefined>()
  const [categoryToDelete, setCategoryToDelete] = useState<ExtendedEventCategory | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Busca categorias
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['event-categories'],
    queryFn: async () => {
      const res = await fetch('/api/events/categories')
      if (!res.ok) throw new Error('Erro ao buscar categorias')
      return res.json() as Promise<EventCategory[]>
    }
  })

  // Busca modalidades para o select
  const { data: modalitiesResponse = { data: [] }, isLoading: isModalitiesLoading } = useQuery({
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

  // Busca relações entre categorias e modalidades
  const { data: categoryModalities = [], isLoading: isRelationsLoading } = useQuery({
    queryKey: ['event-category-modalities'],
    queryFn: async () => {
      const res = await fetch('/api/events/categories/modalities')
      if (!res.ok) throw new Error('Erro ao buscar relações entre categorias e modalidades')
      return res.json() as Promise<{categoryId: string, modalityId: string}[]>
    }
  })

  // Combina as categorias com suas modalidades relacionadas
  const categories: ExtendedEventCategory[] = categoriesData.map(category => {
    const modalityIds = categoryModalities
      .filter(relation => relation.categoryId === category.id)
      .map(relation => relation.modalityId);
    
    return {
      ...category,
      modalityIds
    };
  });

  const isLoading = isCategoriesLoading || isModalitiesLoading || isRelationsLoading;

  // Mutação para criar/editar categoria
  const { mutate: saveCategory, isPending: isSaving } = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await fetch(`/api/events/categories${data.id ? `/${data.id}` : ''}`, {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Erro ao salvar categoria')
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: `Categoria ${categoryToEdit?.id ? 'editada' : 'criada'} com sucesso`
      })
      queryClient.invalidateQueries({ queryKey: ['event-categories'] })
      queryClient.invalidateQueries({ queryKey: ['event-category-modalities'] })
      handleCloseEditor()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Erro ao ${categoryToEdit?.id ? 'editar' : 'criar'} categoria: ${error.message}`
      })
    }
  })

  // Mutação para excluir categoria
  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao excluir categoria')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso'
      })
      queryClient.invalidateQueries({ queryKey: ['event-categories'] })
      setCategoryToDelete(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message
      })
      setCategoryToDelete(null)
    }
  })

  // Handlers
  const handleCreateCategory = () => {
    setCategoryToEdit(undefined)
    setIsEditorOpen(true)
  }

  const handleEditCategory = (category: ExtendedEventCategory) => {
    setCategoryToEdit({
      id: category.id,
      name: category.name,
      description: category.description || '',
      modalityIds: category.modalityIds || [],
      active: category.active
    })
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setCategoryToEdit(undefined)
  }

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id)
    }
  }

  // Função para obter o nome da modalidade pelo ID
  const getModalityName = (modalityId: string) => {
    const modality = modalities.find((m: EventModality) => m.id === modalityId)
    return modality ? modality.name : 'Desconhecida'
  }

  // Definição das colunas da tabela
  const columns: ColumnDef<ExtendedEventCategory>[] = [
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
      accessorKey: 'modalityIds',
      header: 'Modalidades',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          {row.original.modalityIds.map(modalityId => (
            <Badge key={modalityId} variant="outline">
              {getModalityName(modalityId)}
            </Badge>
          ))}
        </div>
      )
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
            onClick={() => handleEditCategory(row.original)}
          >
            Editar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive/80"
            onClick={() => setCategoryToDelete(row.original)}
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
        <h1 className="text-3xl font-bold">Categorias de Eventos</h1>
        <Button onClick={handleCreateCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border">
        <DataTable 
          columns={columns} 
          data={categories}
          searchColumn="name"
          searchPlaceholder="Buscar por nome..."
          emptyMessage="Nenhuma categoria encontrada"
        />
      </div>

      <CategoryEditor
        isOpen={isEditorOpen}
        category={categoryToEdit}
        modalities={modalities.filter((m: any) => m.active)}
        isLoading={isSaving}
        onClose={handleCloseEditor}
        onSubmit={saveCategory}
      />

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"? 
              Esta ação não poderá ser desfeita e pode afetar eventos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
            <p className="font-bold">Configuração de Categorias por Gênero</p>
            <p className="text-sm">Após criar as categorias, acesse <a href="/dashboard/eventos/configuracoes" className="font-medium underline">Configurações de Eventos</a> para definir quais categorias estão disponíveis para cada combinação de modalidade e gênero.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
