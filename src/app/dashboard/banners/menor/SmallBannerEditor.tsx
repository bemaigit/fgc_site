'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'

interface SmallBanner {
  id: string
  title: string
  image: string
  link?: string | null
  position: number
  active: boolean
}

export default function SmallBannerEditor() {
  const [banners, setBanners] = useState<SmallBanner[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [position, setPosition] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/small-banners')
      if (!response.ok) throw new Error('Erro ao buscar banners')
      const data = await response.json()
      setBanners(data)
    } catch (error) {
      console.error('Erro ao buscar banners:', error)
      setError('Erro ao carregar banners existentes')
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('O tamanho máximo da imagem é 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(false)
    setError(null)

    if (!selectedFile) {
      setError('Selecione uma imagem')
      return
    }

    if (!title.trim()) {
      setError('Digite um título para o banner')
      return
    }

    setUploading(true)
    try {
      // Upload da imagem
      const formData = new FormData()
      formData.append('file', selectedFile)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadResponse.ok) throw new Error('Erro ao fazer upload da imagem')
      const { url: imageUrl } = await uploadResponse.json()

      // Criar banner
      const response = await fetch('/api/small-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          image: imageUrl,
          link: link || null,
          position
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar banner')

      setSuccess(true)
      setTitle('')
      setLink('')
      setPosition(0)
      setSelectedFile(null)
      fetchBanners()
    } catch (error) {
      console.error('Erro ao criar banner:', error)
      setError('Erro ao criar banner. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/small-banners?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar banner')

      setSuccess(true)
      fetchBanners()
    } catch (error) {
      console.error('Erro ao atualizar banner:', error)
      setError('Erro ao atualizar banner')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return

    try {
      const response = await fetch(`/api/small-banners?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir banner')

      setSuccess(true)
      fetchBanners()
    } catch (error) {
      console.error('Erro ao excluir banner:', error)
      setError('Erro ao excluir banner')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Banners</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título do Banner</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do banner"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required
          />
          {selectedFile && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Pré-visualização do banner"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link (opcional)</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://exemplo.com"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Posição</label>
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            min="0"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
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
            disabled={uploading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Salvando...' : 'Salvar Banner'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Banners Existentes</h2>
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner.id} className="p-4 border rounded flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  width={96}
                  height={64}
                  className="object-cover rounded"
                />
                <div>
                  <p className="font-medium">{banner.title}</p>
                  {banner.link && (
                    <p className="text-sm text-gray-500">{banner.link}</p>
                  )}
                  <p className="text-sm text-gray-500">Posição: {banner.position}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(banner.id, banner.active)}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    banner.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {banner.active ? 'Ativo' : 'Inativo'}
                </button>
                <button
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Deletar banner"
                  onClick={() => deleteBanner(banner.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}