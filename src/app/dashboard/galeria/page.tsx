'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Plus } from 'lucide-react'
import { GalleryList } from './components/gallery-list'

export default function GalleryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleDelete = async (id: string, slug: string) => {
    try {
      const response = await fetch(`/api/gallery/${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir galeria')
      }

      toast({
        title: "Galeria excluída",
        description: "A galeria foi excluída com sucesso.",
      })

      // Recarregar a lista de galerias
      queryClient.invalidateQueries({ queryKey: ['galleries'] })
    } catch (error) {
      console.error('Erro ao excluir galeria:', error)
      toast({
        title: "Erro ao excluir galeria",
        description: "Ocorreu um erro ao excluir a galeria. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Galeria de Imagens</h1>
            <p className="text-zinc-500 mt-2">
              Gerencie as galerias de imagens dos eventos
            </p>
          </div>

          <Button onClick={() => router.push('/dashboard/galeria/criar')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Galeria
          </Button>
        </div>
      </header>

      <GalleryList 
        onDelete={handleDelete}
      />
    </div>
  )
}
