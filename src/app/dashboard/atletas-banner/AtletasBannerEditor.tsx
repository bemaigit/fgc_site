'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'

// Função para carregar imagens de banners corretamente
function getImageUrl(url: string): string {
  // Se o URL já incluir proxy/storage, significa que ele foi gerado pelo MinIO
  if (url.includes('/api/proxy/storage/')) {
    // Use o URL direto, sem tentar transformá-lo
    return url;
  }
  
  // Para URLs simples sem o caminho de proxy
  if (!url.includes('://') && !url.startsWith('/')) {
    // Adicionar o caminho proxy correto
    return `/api/proxy/storage/${url}`;
  }
  
  // Retornar a URL como está para os outros casos
  return url;
}

interface AthletesBanner {
  id: string
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  ctaText: string
  active: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export default function AtletasBannerEditor() {
  const [banners, setBanners] = useState<AthletesBanner[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [ctaText, setCtaText] = useState('Conheça nossos Atletas')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  // Carrega os banners existentes
  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/athletes-banner')
      if (!response.ok) throw new Error('Erro ao carregar banners')
      const data = await response.json()
      setBanners(data)
    } catch (err) {
      console.error('Erro ao carregar banners:', err)
      setError('Erro ao carregar banners existentes')
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // Gerar preview da imagem quando selecionada
  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreview(null)
    }
  }, [image])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('O tamanho máximo da imagem é 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      setImage(file)
      setError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(false)
    setError(null)
    setIsLoading(true)

    try {
      if (!image) {
        setError('Por favor, selecione uma imagem')
        setIsLoading(false)
        return
      }

      if (!title.trim()) {
        setError('Por favor, insira um título para o banner')
        setIsLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('file', image)
      formData.append('folder', 'Banner conheça atletas') // Pasta específica no MinIO

      // Upload da imagem
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Erro no upload da imagem')
      }

      const { url } = await uploadRes.json()
      console.log('URL original após upload:', url)

      if (!url) {
        throw new Error('URL da imagem não retornada pelo servidor')
      }

      // Processar a URL para extrair apenas o caminho relativo
      let imagePath = url
      try {
        // Extrair o caminho da URL, se for uma URL completa
        if (url.startsWith('http')) {
          const urlObj = new URL(url)
          imagePath = urlObj.pathname
        }
        
        // Remover prefixos conhecidos
        imagePath = imagePath
          .replace(/^\/storage\//, '')
          .replace(/^\/fgc\//, '')
          .replace(/^storage\//, '')
          .replace(/^fgc\//, '')
        
        console.log('Caminho de imagem processado:', imagePath)
      } catch (error) {
        console.warn('Erro ao processar URL, usando original:', error)
      }

      // Criar ou atualizar o banner
      const apiUrl = '/api/athletes-banner'
      const method = banners.length > 0 ? 'PUT' : 'POST'
      const bannerId = banners.length > 0 ? banners[0].id : undefined

      const bannerData = {
        id: bannerId, // Undefined para criação, ID para atualização
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        imageUrl: imagePath,
        ctaText: ctaText.trim() || 'Conheça nossos Atletas',
        active: true,
        order: 0
      }

      const saveRes = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerData),
      })

      const responseData = await saveRes.json()
      console.log('Resposta ao salvar banner:', responseData)
      
      if (!saveRes.ok) {
        throw new Error(responseData.error || 'Erro ao salvar banner')
      }

      // Limpa o formulário e atualiza a lista
      setSuccess(true)
      setTitle('')
      setSubtitle('')
      setDescription('')
      setCtaText('Conheça nossos Atletas')
      setImage(null)
      fetchBanners()

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Erro ao salvar banner:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao salvar banner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) {
      return
    }

    try {
      const response = await fetch(`/api/athletes-banner?id=${bannerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir banner')
      }

      fetchBanners()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Erro ao excluir banner:', err)
      setError('Erro ao excluir banner')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título do Banner</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Conheça nossos Atletas"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subtítulo (Opcional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Ex: Profissionais e Amadores"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Descubra quem são os atletas que representam a Federação Goiana de Ciclismo"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Texto do Botão</label>
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="Ex: Conheça nossos Atletas"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
          <p className="text-xs text-gray-500 mb-2">Recomendado: 1200x400 pixels, máx. 5MB</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required={banners.length === 0}
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Pré-visualização do banner"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-700 bg-green-100 rounded">
            Banner salvo com sucesso!
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Salvando...' : 'Salvar Banner'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Banner Existente</h2>
        <div className="space-y-4">
          {banners.length > 0 ? (
            banners.map((banner) => (
              <div key={banner.id} className="p-4 border rounded flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  {banner.imageUrl && (
                    <>
                      <img
                        src={getImageUrl(banner.imageUrl)}
                        alt={banner.title}
                        className="w-full md:w-48 h-auto md:h-24 object-cover rounded"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem do banner:', banner.imageUrl)
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder-banner.jpg'
                          target.onerror = null
                        }}
                      />
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-1 text-xs text-gray-500 break-all">
                          URL: {getImageUrl(banner.imageUrl)}
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <p className="font-medium">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="text-sm text-gray-700">{banner.subtitle}</p>
                    )}
                    {banner.description && (
                      <p className="text-sm text-gray-500 mt-1">{banner.description}</p>
                    )}
                    <p className="text-sm text-blue-600 mt-1">Botão: {banner.ctaText}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <button
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Deletar banner"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum banner configurado. Crie um usando o formulário acima.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
