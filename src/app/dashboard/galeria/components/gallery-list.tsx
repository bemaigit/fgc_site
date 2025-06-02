'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { FileImage, Image as ImageIcon, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { GalleryListResponse } from '@/types/gallery'

interface GalleryListProps {
  onDelete?: (id: string, slug: string) => void
}

async function fetchGalleries(page: number, limit: number): Promise<GalleryListResponse> {
  const response = await fetch(`/api/gallery?page=${page}&limit=${limit}`)
  if (!response.ok) {
    throw new Error('Erro ao carregar galerias')
  }
  return response.json()
}

export function GalleryList({ onDelete }: GalleryListProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const limit = 9

  const { data: galleries, isLoading, error } = useQuery({
    queryKey: ['admin-galleries', page, limit],
    queryFn: () => fetchGalleries(page, limit),
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-600">
          Carregando galerias...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-800 text-center">
          Erro ao carregar galerias. Por favor, tente novamente.
        </p>
      </Card>
    )
  }

  if (!galleries?.data || galleries.data.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <FileImage className="h-12 w-12 mx-auto text-zinc-400" />
          <h3 className="mt-4 text-lg font-medium">
            Nenhuma galeria encontrada
          </h3>
          <p className="mt-2 text-zinc-500">
            Comece criando uma nova galeria para seus eventos.
          </p>
          <Button
            onClick={() => router.push('/dashboard/galeria/criar')}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Galeria
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries.data.map((gallery) => (
          <Card
            key={gallery.id}
            className="relative group overflow-hidden hover:shadow-md transition-shadow"
          >
            <div 
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center gap-2 p-4"
            >
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/galeria/${gallery.slug}/editar`)}
                  className="bg-white text-blue-600 border-blue-600 hover:bg-blue-100 hover:text-blue-700"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/galeria/${gallery.slug}/imagens`)}
                  className="bg-white text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imagens
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/galeria/${gallery.slug}`, '_blank')}
                  className="bg-white text-purple-600 border-purple-600 hover:bg-purple-100 hover:text-purple-700"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(gallery.id, gallery.slug)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>

            <div className="aspect-video relative">
              {gallery.GalleryImage[0] ? (
                <Image
                  src={gallery.GalleryImage[0].thumbnail}
                  alt={gallery.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                  <FileImage className="h-8 w-8 text-zinc-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium">
                {gallery.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-sm text-zinc-500">
                <div className="flex items-center space-x-4">
                  <span className="capitalize">{gallery.modality}</span>
                  <span>•</span>
                  <span className="capitalize">{gallery.category}</span>
                </div>
                <span>
                  {gallery._count.GalleryImage} {gallery._count.GalleryImage === 1 ? 'imagem' : 'imagens'}
                </span>
              </div>
              <time className="block mt-2 text-sm text-zinc-500">
                {new Date(gallery.date).toLocaleDateString('pt-BR')}
              </time>
            </div>
          </Card>
        ))}
      </div>

      {galleries.pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={galleries.pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}
