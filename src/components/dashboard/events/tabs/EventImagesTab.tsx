'use client'

import React, { useState } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormErrorMessage } from '@/components/ui/form-error-message'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Tipos para upload de imagens
type ImageType = 'cover' | 'poster'
type ImageFile = {
  id: string
  url: string
  file: File
  type: ImageType
}

export function EventImagesTab() {
  const { formData, updateImages, errors } = useEventForm()
  const { images } = formData

  // Estados locais para gerenciar uploads
  const [dragActive, setDragActive] = useState<{ cover: boolean, poster: boolean }>({
    cover: false,
    poster: false
  })
  const [uploading, setUploading] = useState<{ cover: boolean, poster: boolean }>({
    cover: false,
    poster: false
  })
  const [previewImages, setPreviewImages] = useState<ImageFile[]>([])

  // Manipuladores de eventos de drag and drop
  const handleDrag = (e: React.DragEvent, type: ImageType) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [type]: true }))
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleDrop = (e: React.DragEvent, type: ImageType) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(prev => ({ ...prev, [type]: false }))
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, type)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: ImageType) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files, type)
    }
  }

  const handleFiles = (files: FileList, type: ImageType) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) {
      toast.error('Apenas arquivos de imagem são permitidos')
      return
    }
    
    // Limitar a uma imagem para cada tipo
    if (type === 'poster' || type === 'cover') {
      const existingImages = previewImages.filter(img => img.type === type)
      if (existingImages.length > 0) {
        // Remover imagens existentes do mesmo tipo
        setPreviewImages(prev => prev.filter(img => img.type !== type))
      }
      
      // Pegar apenas a primeira imagem
      const imageFile = imageFiles[0]
      
      // Criar preview para a imagem selecionada
      const newPreviewImage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(imageFile),
        file: imageFile,
        type
      }
      
      setPreviewImages(prev => [...prev, newPreviewImage])
    }
  }

  const handleRemoveImage = (id: string) => {
    // Remover do estado local
    setPreviewImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      return filtered
    })
    
    // Se for uma imagem já salva, remover do estado do formulário
    if (!id.startsWith('temp-')) {
      if (id === images.coverImage) {
        updateImages({ coverImage: '' })
      } else if (id === images.posterImage) {
        updateImages({ posterImage: '' })
      }
    }
  }

  const handleUpload = async (type: ImageType) => {
    const imageToUpload = previewImages.find(img => img.type === type)
    if (!imageToUpload) return
    
    setUploading(prev => ({ ...prev, [type]: true }))
    
    try {
      const formData = new FormData()
      formData.append('file', imageToUpload.file)
      formData.append('type', type)
      formData.append('prefix', 'eventos')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }
      
      const data = await response.json()
      console.log('Resposta do upload:', data)
      
      // Processar a URL para extrair apenas o caminho relativo
      let imagePath = `eventos/${imageToUpload.file.name}`
      
      // Se recebemos uma URL completa, extrair apenas o caminho
      if (data.url && data.url.includes('://')) {
        try {
          const urlObj = new URL(data.url)
          // Remover domínio e prefixos conhecidos
          let path = urlObj.pathname
            .replace(/^\/storage\//, '') // Remove /storage/ se existir
            .replace(/^\/fgc\//, '')    // Remove /fgc/ se existir

          // Se ainda não tem o prefixo eventos, adicionar
          if (!path.startsWith('eventos/')) {
            path = `eventos/${path.split('/').pop() || ''}`
          }
          
          imagePath = path
          console.log('Caminho processado a partir da URL:', imagePath)
        } catch (error) {
          console.warn('Erro ao processar URL, usando caminho padrão:', error)
          // Manter o caminho padrão definido acima
        }
      }
      
      // Construir URL para o proxy de imagens
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const proxyUrl = `${baseUrl}/api/events/image?path=${encodeURIComponent(imagePath)}&type=${type}`
      
      console.log('Upload completo:', {
        originalUrl: data.url,
        path: imagePath,
        proxyUrl: proxyUrl
      })
      
      // Atualizar o estado do formulário com a nova imagem
      if (type === 'cover') {
        updateImages({ coverImage: proxyUrl })
      } else if (type === 'poster') {
        updateImages({ posterImage: proxyUrl })
      }
      
      // Remover do estado local
      setPreviewImages(prev => prev.filter(img => img.id !== imageToUpload.id))
      
      toast.success(`Imagem ${type === 'cover' ? 'de capa' : 'do cartaz'} enviada com sucesso`)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar imagem')
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Imagens do Evento</h3>
              <p className="text-sm text-muted-foreground">
                Adicione a imagem de capa e o cartaz do seu evento.
              </p>
            </div>
            
            <Tabs defaultValue="cover" onValueChange={(value) => value}>
              <TabsList>
                <TabsTrigger value="cover">Imagem do Evento</TabsTrigger>
                <TabsTrigger value="poster">Cartaz do Evento</TabsTrigger>
              </TabsList>
              <TabsContent value="cover">
                {/* Área de upload */}
                <div 
                  className={`border-2 border-dashed rounded-md p-8 text-center ${
                    dragActive.cover ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'cover')}
                  onDragOver={(e) => handleDrag(e, 'cover')}
                  onDragLeave={(e) => handleDrag(e, 'cover')}
                  onDrop={(e) => handleDrop(e, 'cover')}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Arraste e solte a imagem aqui
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ou clique para selecionar arquivo
                      </p>
                    </div>
                    <input
                      type="file"
                      id="image-upload-cover"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'cover')}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload-cover')?.click()}
                    >
                      Selecionar Imagem
                    </Button>
                  </div>
                </div>
                
                {/* Previews de imagens selecionadas */}
                {previewImages.filter(img => img.type === 'cover').length > 0 && (
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">Imagem Selecionada</h4>
                      <Button
                        variant="default"
                        onClick={() => handleUpload('cover')}
                        disabled={uploading.cover}
                      >
                        {uploading.cover ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : 'Enviar Imagem'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previewImages.filter(img => img.type === 'cover').map((image) => (
                        <div key={image.id} className="relative group aspect-video">
                          <Image
                            src={image.url}
                            alt="Preview"
                            fill
                            className="object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Imagens já enviadas */}
                {images.coverImage && (
                  <div className="space-y-4 mt-4">
                    <h4 className="text-md font-medium">Imagem do Evento</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group aspect-video">
                        <Image
                          src={images.coverImage}
                          alt="Imagem do Evento"
                          fill
                          className="object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(images.coverImage)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="poster">
                {/* Área de upload */}
                <div 
                  className={`border-2 border-dashed rounded-md p-8 text-center ${
                    dragActive.poster ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'poster')}
                  onDragOver={(e) => handleDrag(e, 'poster')}
                  onDragLeave={(e) => handleDrag(e, 'poster')}
                  onDrop={(e) => handleDrop(e, 'poster')}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        Arraste e solte a imagem aqui
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ou clique para selecionar arquivo
                      </p>
                    </div>
                    <input
                      type="file"
                      id="image-upload-poster"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'poster')}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload-poster')?.click()}
                    >
                      Selecionar Imagem
                    </Button>
                  </div>
                </div>
                
                {/* Previews de imagens selecionadas */}
                {previewImages.filter(img => img.type === 'poster').length > 0 && (
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">Imagem Selecionada</h4>
                      <Button
                        variant="default"
                        onClick={() => handleUpload('poster')}
                        disabled={uploading.poster}
                      >
                        {uploading.poster ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : 'Enviar Imagem'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previewImages.filter(img => img.type === 'poster').map((image) => (
                        <div key={image.id} className="relative group aspect-video">
                          <Image
                            src={image.url}
                            alt="Preview"
                            fill
                            className="object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(image.id)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Imagens já enviadas */}
                {images.posterImage && (
                  <div className="space-y-4 mt-4">
                    <h4 className="text-md font-medium">Cartaz do Evento</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group aspect-video">
                        <Image
                          src={images.posterImage}
                          alt="Cartaz do Evento"
                          fill
                          className="object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(images.posterImage)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Mensagem quando não há imagens */}
            {previewImages.length === 0 && !images.coverImage && !images.posterImage && (
              <div className="flex flex-col items-center justify-center p-8 border rounded-md">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma imagem adicionada
                </p>
              </div>
            )}
            
            {errors.coverImage && (
              <FormErrorMessage>{errors.coverImage}</FormErrorMessage>
            )}
            {errors.posterImage && (
              <FormErrorMessage>{errors.posterImage}</FormErrorMessage>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
