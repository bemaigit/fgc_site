'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { processPartnerImageUrl } from '@/lib/processPartnerImageUrl'

interface Partner {
  id: string
  name: string
  logo: string
  link?: string | null
  order: number
  active: boolean
}

export default function PartnerEditor() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [order, setOrder] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      // Usa o endpoint público que já retorna as URLs completas
      const response = await fetch('/api/public/partners')
      if (!response.ok) throw new Error('Erro ao buscar parceiros')
      const data = await response.json()
      setPartners(data)
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error)
      setError('Erro ao carregar parceiros existentes')
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

    if (!name.trim()) {
      setError('Digite o nome do parceiro')
      return
    }

    setUploading(true)
    try {
      // Upload da imagem
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('prefix', 'parceiros')

      console.log('Enviando upload com:', {
        filename: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        prefix: 'parceiros'
      })

      // Primeiro faz o upload
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error('Erro ao fazer upload da imagem')
      
      // Extrai os dados da resposta
      const uploadData = await uploadResponse.json()
      console.log('Resposta do upload:', uploadData)
      
      // Usa o caminho retornado pela API
      const logoPath = uploadData.url || ''

      console.log('Upload concluído. Salvando parceiro com:', {
        name,
        logoPath,
        link,
        order
      })

      // Criar parceiro
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logo: logoPath,
          link: link || null,
          order
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar parceiro')

      setSuccess(true)
      setName('')
      setLink('')
      setOrder(0)
      setSelectedFile(null)
      fetchPartners()
    } catch (error) {
      console.error('Erro ao criar parceiro:', error)
      setError('Erro ao criar parceiro. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/partners?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar parceiro')

      setSuccess(true)
      fetchPartners()
    } catch (error) {
      console.error('Erro ao atualizar parceiro:', error)
      setError('Erro ao atualizar parceiro')
    }
  }

  const deletePartner = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parceiro?')) return

    try {
      const response = await fetch(`/api/partners?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir parceiro')

      setSuccess(true)
      fetchPartners()
    } catch (error) {
      console.error('Erro ao excluir parceiro:', error)
      setError('Erro ao excluir parceiro')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Parceiros</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Parceiro</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite o nome do parceiro"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Logo do Parceiro</label>
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
                alt="Pré-visualização do logo"
                className="max-h-32 object-contain"
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
          <label className="block text-sm font-medium mb-2">Ordem</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
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
            Parceiro salvo com sucesso!
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
            {uploading ? 'Salvando...' : 'Salvar Parceiro'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Parceiros Existentes</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div key={partner.id} className="p-4 border rounded">
              <div className="flex flex-col items-center space-y-2">
                <Image
                  src={partner.logo ? processPartnerImageUrl(partner.logo) : '/images/partner-placeholder.jpg'}
                  alt={partner.name}
                  width={100}
                  height={100}
                  className="object-contain"
                />
                <div className="text-center">
                  <p className="font-medium">{partner.name}</p>
                  {partner.link && (
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {partner.link}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">Ordem: {partner.order}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(partner.id, partner.active)}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      partner.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {partner.active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Deletar parceiro"
                    onClick={() => deletePartner(partner.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
