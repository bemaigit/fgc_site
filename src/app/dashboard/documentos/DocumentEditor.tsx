'use client'

import React, { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  downloads: number
  createdAt: string
}

export default function DocumentEditor() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Carrega os documentos existentes
  const fetchDocuments = async () => {
    try {
      console.log('Iniciando busca de documentos...');
      const response = await fetch('/api/documents');
      console.log('Status da resposta:', response.status);
      
      const text = await response.text();
      console.log('Resposta bruta:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        throw new Error('Resposta inválida do servidor');
      }
      
      if (!response.ok) {
        console.error('Erro da API:', data);
        throw new Error(data.details || data.error || 'Erro ao carregar documentos');
      }

      setDocuments(data);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setError('Erro ao carregar documentos existentes');
      // Não falha completamente, apenas mostra o erro
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0]
      // Limite de 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('O tamanho máximo do arquivo é 10MB')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess(false)
    setError(null)
    setIsLoading(true)

    try {
      if (!file) {
        setError('Por favor, selecione um arquivo')
        return
      }

      if (!title.trim()) {
        setError('Por favor, insira um título para o documento')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      if (description) {
        formData.append('description', description)
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Erro ao criar documento'
        try {
          const data = JSON.parse(text)
          errorMessage = data.error
          if (data.details) {
            console.error('Detalhes do erro:', data.details)
            errorMessage += `: ${data.details}`
          }
        } catch (e) {
          console.error('Resposta da API:', text)
        }
        throw new Error(errorMessage)
      }

      const document = await response.json()
      setSuccess(true)
      setTitle('')
      setDescription('')
      setFile(null)
      fetchDocuments()
    } catch (err) {
      console.error('Erro:', err)
      setError(err.message || 'Erro ao criar documento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este documento?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao remover documento')
      }

      fetchDocuments()
    } catch (err) {
      console.error('Erro ao remover documento:', err)
      setError('Erro ao remover documento')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">
            Arquivo
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Digite o título do documento"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Digite uma descrição para o documento"
            rows={3}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {success && (
          <div className="text-green-500 text-sm">
            Documento criado com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Enviando...' : 'Enviar Documento'}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Documentos Cadastrados</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arquivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.title}
                    </div>
                    {doc.description && (
                      <div className="text-sm text-gray-500">
                        {doc.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {doc.fileName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.downloads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
