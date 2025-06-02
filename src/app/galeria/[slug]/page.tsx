'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Loader2, Download } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Gallery } from '@/types/gallery'
import { processGalleryImageUrl } from '@/lib/processGalleryImageUrl'

async function fetchGallery(slug: string): Promise<Gallery> {
  const response = await fetch(`/api/gallery/${slug}`)
  if (!response.ok) {
    throw new Error('Erro ao carregar galeria')
  }
  return response.json()
}

interface GalleryViewerState {
  isOpen: boolean
  currentIndex: number
}

export default function GalleryPage() {
  const params = useParams()
  const [viewer, setViewer] = useState<GalleryViewerState>({
    isOpen: false,
    currentIndex: 0
  })
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const { data: gallery, isLoading, error } = useQuery({
    queryKey: ['gallery', params.slug],
    queryFn: () => fetchGallery(params.slug as string),
  })

  const openViewer = (index: number) => {
    setViewer({
      isOpen: true,
      currentIndex: index
    })
  }

  const closeViewer = () => {
    setViewer({
      isOpen: false,
      currentIndex: 0
    })
  }

  const nextImage = () => {
    if (!gallery) return
    setViewer(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % gallery.GalleryImage.length
    }))
  }

  const previousImage = () => {
    if (!gallery) return
    setViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 
        ? gallery.GalleryImage.length - 1 
        : prev.currentIndex - 1
    }))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-600">
          Carregando galeria...
        </span>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800 text-center">
            Erro ao carregar galeria. Por favor, tente novamente.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Botão para voltar à galeria e para a página inicial */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/galeria" className="inline-flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"></path><path d="m5 12 4 4"></path><path d="m5 12 4-4"></path></svg>
            Voltar para a galeria
          </Button>
        </Link>
        
        <Link href="/" className="inline-flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Página inicial
          </Button>
        </Link>
      </div>
      
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-3xl font-bold mb-2">{gallery.title}</h1>
        <div className="flex items-center justify-center space-x-2 text-sm text-zinc-500">
          <span className="capitalize">{gallery.modality}</span>
          <span>•</span>
          <span className="capitalize">{gallery.category}</span>
          <span>•</span>
          <time>{new Date(gallery.date).toLocaleDateString('pt-BR')}</time>
        </div>
        {gallery.description && (
          <p className="mt-4 text-lg text-zinc-600">
            {gallery.description}
          </p>
        )}
        
        {/* Filtro de Categorias */}
        {(() => {
          // Extrair categorias únicas das imagens
          const categories = Array.from(new Set(gallery.GalleryImage.map(image => {
            // Extrair categoria da URL
            const parts = image.url.split('/');
            return parts.length >= 3 ? parts[parts.length - 3] : 'default';
          })));
          
          // Se tivermos mais de uma categoria, mostrar o filtro
          return categories.length > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveCategory('all')}
                className="text-sm"
              >
                Todas
              </Button>
              
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(cat)}
                  className="text-sm"
                >
                  {cat === 'default' ? 'Geral' : cat.replace(/-/g, ' ')}
                </Button>
              ))}
            </div>
          ) : null;
        })()}
      </header>

      {(() => {
        if (activeCategory === 'all') {
          // Mostrar grade simples quando todas as categorias estão selecionadas
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {gallery.GalleryImage.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => openViewer(index)}
                >
                  <Image
                    src={processGalleryImageUrl(image.url)}
                    alt={`Imagem ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    onError={(e) => {
                      console.error(`Erro ao carregar imagem da galeria #${index + 1}`);
                      e.currentTarget.src = '/images/gallery-placeholder.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="default"
                      size="icon"
                      className="bg-blue-600 text-white hover:bg-blue-700 border-none shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(image.url, '_blank')
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          );
        } else {
          // Quando uma categoria específica é selecionada, filtrar imagens
          const filteredImages = gallery.GalleryImage.filter(image => {
            const parts = image.url.split('/');
            const imageCategory = parts.length >= 3 ? parts[parts.length - 3] : 'default';
            return imageCategory === activeCategory;
          });
          
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {filteredImages.map((image, index) => {
                // Encontrar o índice global para o viewer
                const globalIndex = gallery.GalleryImage.findIndex(img => img.id === image.id);
                
                return (
                  <div
                    key={image.id}
                    className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden"
                    onClick={() => openViewer(globalIndex)}
                  >
                    <Image
                      src={processGalleryImageUrl(image.thumbnail)}
                      alt={`Imagem ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      onError={(e) => {
                        console.error(`Erro ao carregar miniatura da galeria #${index + 1}`);
                        e.currentTarget.src = '/images/gallery-placeholder.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button
                        variant="default"
                        size="icon"
                        className="bg-blue-600 text-white hover:bg-blue-700 border-none shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(image.url, '_blank')
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
      })()}

      {viewer.isOpen && gallery.GalleryImage.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeViewer}
        >
          <div className="relative max-w-7xl mx-auto px-4" onClick={e => e.stopPropagation()}>
            <Image
              src={processGalleryImageUrl(gallery.GalleryImage[viewer.currentIndex].url)}
              alt={`Imagem ${viewer.currentIndex + 1}`}
              width={1920}
              height={1080}
              className="max-h-[85vh] w-auto"
              onError={(e) => {
                console.error(`Erro ao carregar imagem ampliada #${viewer.currentIndex + 1}`);
                e.currentTarget.src = '/images/gallery-placeholder.jpg';
              }}
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="default"
                size="icon"
                className="bg-blue-600 text-white hover:bg-blue-700 border-none shadow-md"
                onClick={() => window.open(gallery.GalleryImage[viewer.currentIndex].url, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            {gallery.GalleryImage.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-blue-400"
                  onClick={previousImage}
                >
                  ❮
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:text-blue-400"
                  onClick={nextImage}
                >
                  ❯
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
