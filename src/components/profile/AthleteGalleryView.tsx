'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

// Interface para as imagens da galeria
interface GalleryImage {
  id: string
  imageUrl: string
  imageUrlClean?: string
  directUrl?: string
  title: string | null
  description: string | null
  featured: boolean
  order: number
}

interface AthleteGalleryViewProps {
  images: GalleryImage[]
  onEdit?: (image: GalleryImage) => void
  onDelete?: (imageId: string) => void
  onSetFeatured?: (imageId: string) => void
  readOnly?: boolean
}

export function AthleteGalleryView({ 
  images, 
  onEdit, 
  onDelete, 
  onSetFeatured, 
  readOnly = false 
}: AthleteGalleryViewProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Gera URLs alternativos para uma imagem
  const generateAlternativeUrls = (image: GalleryImage) => {
    if (!image.imageUrl) return []
    
    const originalUrl = image.imageUrl
    const fileName = originalUrl.split('/').pop() || ''
    
    // Garante que temos variações do nome em minúsculas/maiúsculas
    const fileNameLower = fileName.toLowerCase()
    const isAlreadyLower = fileName === fileNameLower
    
    // Detecta se o nome do arquivo começa com "Athlete-" e cria uma versão minúscula
    const fileNameNormalized = fileNameLower.startsWith('athlete-') 
      ? fileNameLower
      : fileNameLower.replace(/^athlete-/i, 'athlete-')
    
    console.log('Gerando URLs alternativas:', {
      originalUrl,
      fileName,
      fileNameLower,
      fileNameNormalized
    })
    
    // Cria várias alternativas de URLs para tentar carregar a imagem
    return [
      // URL direta do MinIO
      image.directUrl,
      
      // URL original
      originalUrl,
      
      // API de imagem com diferentes formatos (garantindo que tentamos com minúsculas)
      `/api/athlete-gallery/image?path=${encodeURIComponent(originalUrl)}`,
      `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(fileName)}`,
      `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(fileNameLower)}`,
      
      // Tenta explicitamente o padrão que sabemos que está funcionando
      `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(fileNameNormalized)}`,
      
      // Outras variações de URL
      `/api/proxy?url=${encodeURIComponent(originalUrl)}`,
      
      // URL direta do MinIO (se estiver disponível) - também com variações
      process.env.NEXT_PUBLIC_MINIO_URL 
        ? [
            `${process.env.NEXT_PUBLIC_MINIO_URL}/fgc/athlete-gallery/${encodeURIComponent(fileName)}`,
            `${process.env.NEXT_PUBLIC_MINIO_URL}/fgc/athlete-gallery/${encodeURIComponent(fileNameLower)}`,
            `${process.env.NEXT_PUBLIC_MINIO_URL}/fgc/athlete-gallery/${encodeURIComponent(fileNameNormalized)}`
          ]
        : null,
        
      // URL de fallback padrão
      '/images/placeholder-athlete.jpg'
    ].flat().filter(Boolean) as string[]
  }

  // Tenta carregar a imagem com uma URL alternativa
  const tryLoadWithAlternativeUrl = (imageId: string, imgElement: HTMLImageElement, currentIndex = 0) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return
    
    const urls = generateAlternativeUrls(image)
    if (currentIndex >= urls.length) {
      // Se já tentamos todas as URLs, usamos o placeholder
      console.log('Todas as URLs falharam para a imagem:', imageId)
      imgElement.src = '/images/placeholder-athlete.jpg'
      return
    }
    
    const nextUrl = urls[currentIndex]
    console.log(`Tentando URL alternativa (${currentIndex + 1}/${urls.length}):`, nextUrl)
    
    // Define manipulador de erro antes de definir a nova src
    imgElement.onerror = () => {
      console.error(`Falha ao carregar imagem com URL (${currentIndex + 1}/${urls.length}):`, nextUrl)
      // Tenta a próxima URL
      tryLoadWithAlternativeUrl(imageId, imgElement, currentIndex + 1)
    }
    
    imgElement.src = nextUrl
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <div 
          key={image.id} 
          className={`rounded-lg overflow-hidden bg-white border ${
            image.featured ? 'ring-2 ring-yellow-400' : ''
          }`}
        >
          <div className="relative pt-[75%]">
            <Image
              src={image.directUrl || image.imageUrl}
              alt={image.title || `Foto do atleta ${image.id}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              onLoad={() => {
                setLoadedImages(prev => {
                  const updated = new Set(prev)
                  updated.add(image.id)
                  return updated
                })
                console.log('Imagem carregada com sucesso:', {
                  id: image.id,
                  url: image.directUrl || image.imageUrl,
                  timestamp: new Date().toISOString()
                })
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                console.error('Erro ao carregar imagem:', {
                  id: image.id,
                  originalUrl: image.imageUrl,
                  cleanUrl: image.imageUrlClean,
                  directUrl: image.directUrl,
                  timestamp: new Date().toISOString()
                })
                
                setFailedImages(prev => {
                  const updated = new Set(prev)
                  updated.add(image.id)
                  return updated
                })
                
                // Tenta carregar com URLs alternativas
                tryLoadWithAlternativeUrl(image.id, target)
              }}
              unoptimized={true} // Desativa otimização para evitar problemas com CORS
            />
            
            {image.featured && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold py-1 px-2 rounded">
                Destaque
              </div>
            )}
          </div>
          
          {!readOnly && (
            <div className="p-3 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-medium truncate">{image.title || 'Sem título'}</h3>
                
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(image)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar imagem"
                    >
                      Editar
                    </button>
                  )}
                  
                  {onSetFeatured && !image.featured && (
                    <button
                      onClick={() => onSetFeatured(image.id)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Definir como destaque"
                    >
                      Destacar
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => onDelete(image.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Excluir imagem"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
              
              {image.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {image.description}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
