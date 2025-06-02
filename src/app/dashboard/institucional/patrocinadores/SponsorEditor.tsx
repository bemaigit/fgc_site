'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, Image as ImageIcon, X } from 'lucide-react'

interface Sponsor {
  id: string
  name: string
  logo: string
  link?: string | null
  order: number
  active: boolean
}

export default function SponsorEditor() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [order, setOrder] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSponsors()
  }, [])

  const fetchSponsors = async () => {
    try {
      setError(null)
      const response = await fetch('/api/sponsors')
      if (!response.ok) throw new Error('Erro ao buscar patrocinadores')
      const data = await response.json()
      setSponsors(data)
    } catch (error) {
      console.error('Erro ao buscar patrocinadores:', error)
      setError('Erro ao carregar patrocinadores existentes')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Verifica se o arquivo é uma imagem
      if (!files[0].type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive"
        })
        return
      }
      
      setSelectedFile(files[0])
      
      // Criar URL para prévia da imagem
      const fileUrl = URL.createObjectURL(files[0])
      setPreviewUrl(fileUrl)
    }
  }

  // Função para limpar o arquivo selecionado
  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async () => {
    if (!selectedFile) return null

    try {
      setIsUploading(true)
      setUploadProgress(10) // Iniciar progresso
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('prefix', 'patrocinadores')

      // Simulação de progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      
      if (!response.ok) {
        setUploadProgress(0)
        throw new Error('Falha no upload da imagem')
      }

      setUploadProgress(100)
      const data = await response.json()
      console.log('Resposta do upload:', data)
      
      // Processar a URL para extrair apenas o caminho relativo
      let imagePath = `patrocinadores/${selectedFile.name}`
      
      // Se recebemos uma URL completa, extrair apenas o caminho
      if (data.url && data.url.includes('://')) {
        try {
          const urlObj = new URL(data.url)
          // Remover domínio e prefixos conhecidos
          let path = urlObj.pathname
            .replace(/^\/storage\//, '') // Remove /storage/ se existir
            .replace(/^\/fgc\//, '')    // Remove /fgc/ se existir

          // Se ainda não tem o prefixo patrocinadores, adicionar
          if (!path.startsWith('patrocinadores/')) {
            path = `patrocinadores/${path.split('/').pop() || ''}`
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
      const proxyUrl = `${baseUrl}/api/sponsor/image?path=${encodeURIComponent(imagePath)}`
      
      console.log('Upload completo:', {
        originalUrl: data.url,
        path: imagePath,
        proxyUrl: proxyUrl
      })
      
      return {
        success: true,
        path: imagePath, // Guardar o caminho relativo
        url: proxyUrl,   // Retornar a URL do proxy
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      return null
    } finally {
      setIsUploading(false)
      // Reset progress após um delay para mostrar 100%
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const createSponsor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!selectedFile) {
      setError('Imagem do logo é obrigatória')
      return
    }

    try {
      const uploadResult = await uploadFile()
      if (!uploadResult) {
        throw new Error('Falha ao fazer upload do logo')
      }

      // Usar o caminho retornado pelo upload
      const logoPath = uploadResult.path

      const sponsorData = {
        name: name.trim(),
        logo: logoPath,
        link: link.trim() || null,
        order: Number(order) || 0,
      }

      const response = await fetch('/api/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sponsorData),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar patrocinador')
      }

      toast({
        title: "Sucesso!",
        description: "Patrocinador criado com sucesso.",
      })

      // Limpar formulário
      setName('')
      setLink('')
      setOrder(0)
      setSelectedFile(null)
      const fileInput = document.getElementById('logo') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Atualizar lista
      fetchSponsors()
    } catch (error) {
      console.error('Erro:', error)
      setError('Falha ao criar patrocinador. Tente novamente.')
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/sponsors?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !currentStatus }),
      })
      
      if (!response.ok) throw new Error('Erro ao atualizar status')
      
      fetchSponsors()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do patrocinador",
        variant: "destructive"
      })
    }
  }

  const deleteSponsor = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este patrocinador?")) {
      return
    }

    try {
      const response = await fetch(`/api/sponsors?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erro ao excluir patrocinador')
      
      toast({
        title: "Sucesso!",
        description: "Patrocinador excluído com sucesso.",
      })
      
      fetchSponsors()
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: "Erro",
        description: "Falha ao excluir patrocinador",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Patrocinadores</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Adicionar Novo Patrocinador</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={createSponsor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do patrocinador"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="order">Ordem</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Números menores aparecem primeiro</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Logo*</Label>
              <div className="flex flex-col space-y-2">
                <div className="border rounded-lg overflow-hidden">
                  <div 
                    className={`relative flex items-center justify-center h-32 bg-gray-50 border-2 border-dashed rounded-lg ${
                      previewUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                    } transition-colors`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <>
                        <img 
                          src={previewUrl} 
                          alt="Prévia" 
                          className="h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearSelectedFile()
                          }}
                          className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4 cursor-pointer">
                        <ImageIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Clique para selecionar uma imagem
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, SVG (max. 2MB)
                        </p>
                      </div>
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                  
                  <Input
                    id="logo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!selectedFile}
                    className="hidden"
                  />
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar arquivo
                </Button>
              </div>
              <p className="text-xs text-gray-500">Formatos recomendados: PNG, JPG, SVG</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Enviando...' : 'Adicionar Patrocinador'}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Patrocinadores Existentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="p-4 border rounded">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 flex-shrink-0">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{sponsor.name}</p>
                  {sponsor.link && (
                    <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {sponsor.link}
                    </a>
                  )}
                  <p className="text-sm text-gray-500">Ordem: {sponsor.order}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    onClick={() => toggleActive(sponsor.id, sponsor.active)}
                    variant="outline"
                    className={
                      sponsor.active
                        ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    }
                  >
                    {sponsor.active ? 'Ativo' : 'Inativo'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteSponsor(sponsor.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sponsors.length === 0 && (
          <div className="text-center p-4 text-gray-500">
            Nenhum patrocinador cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
