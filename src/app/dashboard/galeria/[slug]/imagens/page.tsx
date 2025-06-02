'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, Grid, List, Loader2, Upload, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Gallery } from '@/types/gallery'
import { processGalleryImageUrl } from '@/lib/processGalleryImageUrl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

async function fetchGallery(slug: string): Promise<Gallery> {
  const response = await fetch(`/api/gallery/${slug}`)
  if (!response.ok) throw new Error('Falha ao carregar galeria')
  return response.json()
}

export default function GalleryImagesPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [category, setCategory] = useState<string>('default')
  const [customCategory, setCustomCategory] = useState<string>('')
  const [showCustomCategory, setShowCustomCategory] = useState<boolean>(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Categorias predefinidas comuns nas competições
  const predefinedCategories = [
    'default',
    'Elite Masculino',
    'Elite Feminino',
    'Sub-23 Masculino',
    'Sub-23 Feminino',
    'Junior Masculino',
    'Junior Feminino',
    'Infanto-Juvenil',
    'Master',
    'Pódio',
    'Largada',
    'Premiação',
    'custom'
  ]

  // Buscar dados da galeria
  const { data: gallery, isLoading, error } = useQuery({
    queryKey: ['gallery', params.slug],
    queryFn: () => fetchGallery(params.slug as string),
  })

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((current) => [...current, ...newFiles])
  }

  const handleFileRemove = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'Nenhuma imagem selecionada',
        description: 'Selecione pelo menos uma imagem para enviar.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsUploading(true)

      // Determinar a categoria a ser usada
      const selectedCategory = category === 'custom' ? customCategory : category

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', selectedCategory)

        const response = await fetch(`/api/gallery/${params.slug}/images/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Erro ao enviar imagem: ${file.name}`)
        }

        return response.json()
      })

      await Promise.all(uploadPromises)

      toast({
        title: 'Upload concluído',
        description: `${files.length} imagens enviadas com sucesso.`,
      })

      setFiles([])
      // Recarregar a página para mostrar as novas imagens
      router.refresh()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro no upload',
        description: 'Ocorreu um erro ao enviar as imagens. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreviousPage = () => {
    router.push('/dashboard/galeria')
  }

  const handleDeleteImage = async (imageId: string) => {
    setImageToDelete(imageId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return
    
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/gallery/${params.slug}/images/${imageToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir imagem')
      }
      
      queryClient.invalidateQueries({ queryKey: ['gallery', params.slug] })
      
      toast({
        title: 'Imagem excluída',
        description: 'A imagem foi excluída com sucesso.',
      })
    } catch (error) {
      console.error('Erro ao excluir imagem:', error)
      toast({
        title: 'Erro ao excluir imagem',
        description: 'Ocorreu um erro ao excluir a imagem. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setImageToDelete(null)
    }
  }

  const cancelDeleteImage = () => {
    setIsDeleteDialogOpen(false)
    setImageToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-2 text-zinc-600">
          Carregando galeria...
        </span>
      </div>
    )
  }

  if (error || !gallery) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800 text-center">
            Erro ao carregar galeria. Por favor, tente novamente.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handlePreviousPage}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a galeria
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Imagens da Galeria</h1>
            <p className="text-zinc-500 mt-2">
              {gallery.title}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
            >
              {isUploading ? (
                'Enviando...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar {files.length} {files.length === 1 ? 'imagem' : 'imagens'}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {/* Área de Upload */}
        <Card className="p-6">
          <div className="mb-6">
            <Label htmlFor="category" className="mb-2 block">Categoria das Imagens</Label>
            <div className="flex gap-2">
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setShowCustomCategory(value === 'custom');
                }}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'default' ? 'Geral' : 
                       cat === 'custom' ? 'Categoria Personalizada' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showCustomCategory && (
              <div className="mt-2">
                <Label htmlFor="customCategory" className="mb-2 block">Nome da Categoria Personalizada</Label>
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ex: Master 50+"
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          <ImageUpload
            files={files}
            onFilesSelected={handleFilesSelected}
            onFileRemove={handleFileRemove}
            isUploading={isUploading}
            maxFiles={50}
            maxSize={2 * 1024 * 1024} // 2MB
          />
        </Card>

        {/* Lista de Imagens */}
        {gallery.GalleryImage.length > 0 ? (
          <>
            <div className="mb-6">
              <Label htmlFor="filter-category" className="mb-2 block">Filtrar por Categoria</Label>
              <Select
                defaultValue="all"
                onValueChange={(value) => {
                  // A implementação do filtro será via CSS para manter a simplicidade
                  if (value === 'all') {
                    document.querySelectorAll('.category-group').forEach(el => {
                      (el as HTMLElement).style.display = 'block';
                    });
                  } else {
                    document.querySelectorAll('.category-group').forEach(el => {
                      if (el.id === `category-${value}`) {
                        (el as HTMLElement).style.display = 'block';
                      } else {
                        (el as HTMLElement).style.display = 'none';
                      }
                    });
                  }
                }}
              >
                <SelectTrigger id="filter-category" className="w-full md:w-64">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {/* Extrair categorias únicas das imagens */}
                  {Array.from(new Set(gallery.GalleryImage.map(image => {
                    // Extrair categoria da URL
                    const parts = image.url.split('/');
                    return parts.length >= 3 ? parts[parts.length - 3] : 'default';
                  }))).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'default' ? 'Geral' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agrupar imagens por categoria */}
            {(() => {
              // Criar mapa de categorias e imagens
              const categorizedImages = gallery.GalleryImage.reduce((acc, image) => {
                // Extrair categoria da URL
                const parts = image.url.split('/');
                const category = parts.length >= 3 ? parts[parts.length - 3] : 'default';
                
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(image);
                return acc;
              }, {} as Record<string, typeof gallery.GalleryImage>);

              // Renderizar grupos de categorias
              return Object.entries(categorizedImages).map(([category, images]) => (
                <div 
                  key={category} 
                  id={`category-${category}`}
                  className="category-group mb-8"
                >
                  <h3 className="text-xl font-semibold mb-4 capitalize">
                    {category === 'default' ? 'Geral' : category.replace(/-/g, ' ')}
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "space-y-4"
                  }>
                    {images.map((image) => (
                      <Card 
                        key={image.id}
                        className={viewMode === 'grid' 
                          ? "overflow-hidden group relative"
                          : "overflow-hidden group flex items-center gap-4 p-2 relative"
                        }
                      >
                        <div className={viewMode === 'grid' 
                          ? "aspect-square relative"
                          : "w-24 h-24 relative flex-shrink-0"
                        }>
                          <Image
                            src={processGalleryImageUrl(image.thumbnail)}
                            alt={image.filename}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              console.error(`Erro ao carregar miniatura: ${image.filename}`);
                              e.currentTarget.src = '/images/gallery-placeholder.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="destructive" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {viewMode === 'list' && (
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">
                              {image.filename.split('/').pop()}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {Math.round(image.size / 1024)} KB
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </>
        ) : (
          <Card className="p-6">
            <p className="text-center text-zinc-500">
              Nenhuma imagem adicionada ainda.
            </p>
          </Card>
        )}
      </div>
      {isDeleteDialogOpen && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Imagem</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a imagem?
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteImage}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteImage} disabled={isDeleting}>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
