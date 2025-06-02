'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileImage, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Pagination } from '@/components/ui/pagination'
import type { GalleryListResponse } from '@/types/gallery'
import { processGalleryImageUrl } from '@/lib/processGalleryImageUrl'

async function fetchPublicGalleries(page: number, limit: number): Promise<GalleryListResponse> {
  const response = await fetch(`/api/gallery?page=${page}&limit=${limit}`)
  if (!response.ok) {
    throw new Error('Erro ao carregar galerias')
  }
  return response.json()
}

export default function PublicGalleryPage() {
  const [page, setPage] = useState(1)
  const limit = 12

  const { data: galleries, isLoading, error } = useQuery({
    queryKey: ['public-galleries', page, limit],
    queryFn: () => fetchPublicGalleries(page, limit),
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Botão para voltar à página inicial */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"></path><path d="m5 12 4 4"></path><path d="m5 12 4-4"></path></svg>
            Voltar para o site
          </Button>
        </Link>
      </div>
      
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-zinc-900">
          Galeria de Imagens
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Confira as imagens dos eventos realizados pela FGC
        </p>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-2 text-zinc-600">
            Carregando galerias...
          </span>
        </div>
      )}

      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800 text-center">
            Erro ao carregar galerias. Por favor, tente novamente.
          </p>
        </Card>
      )}

      {!isLoading && !error && (!galleries?.data || galleries.data.length === 0) && (
        <Card className="p-12">
          <div className="text-center">
            <FileImage className="h-12 w-12 mx-auto text-zinc-400" />
            <h3 className="mt-4 text-xl font-medium">
              Nenhuma galeria disponível
            </h3>
            <p className="mt-2 text-zinc-500">
              No momento não há galerias de imagens publicadas.
            </p>
          </div>
        </Card>
      )}

      {galleries?.data && galleries.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.data.map((gallery) => (
              <Link
                key={gallery.id}
                href={`/galeria/${gallery.slug}`}
                className="block group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video relative">
                    {gallery.GalleryImage[0] ? (
                      <Image
                        src={processGalleryImageUrl(gallery.GalleryImage[0].thumbnail)}
                        alt={gallery.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error(`Erro ao carregar miniatura da galeria: ${gallery.title}`);
                          e.currentTarget.src = '/images/gallery-placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                        <FileImage className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="font-semibold text-xl group-hover:text-blue-600 transition-colors">
                      {gallery.title}
                    </h2>
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
                    <time className="block mt-4 text-sm text-zinc-500">
                      {new Date(gallery.date).toLocaleDateString('pt-BR')}
                    </time>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {galleries.pagination.totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={page}
                totalPages={galleries.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
