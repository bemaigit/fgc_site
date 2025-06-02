'use client'

import { useState } from 'react'
import Image from 'next/image'
import { processFooterLogoUrl } from '@/lib/processFooterLogoUrl'

interface LogoUploaderProps {
  currentLogo: string
  onLogoChange: (logo: string) => void
}

// Usar a função processFooterLogoUrl para obter URL completa
const getFullImageUrl = (path: string) => {
  if (!path) return '/images/logo-fgc.png'
  return processFooterLogoUrl(path)
}

export function LogoUploader({ currentLogo, onLogoChange }: LogoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setError('O tamanho máximo da imagem é 2MB')
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

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('prefix', 'footer')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error('Erro ao fazer upload da imagem')
      
      const { url } = await uploadResponse.json()
      onLogoChange(url)
      setSelectedFile(null)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setError('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {/* Preview da logo atual */}
        <div className="w-40 h-40 relative border rounded">
          <Image
            src={currentLogo ? getFullImageUrl(currentLogo) : '/images/logo-fgc.png'}
            alt="Logo atual"
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>

        <div className="flex-1">
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
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>
      </div>

      {/* Preview do arquivo selecionado */}
      {selectedFile && (
        <div className="mt-4 flex items-center space-x-4">
          <div className="w-40 h-40 relative border rounded">
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              fill
              className="object-contain p-2"
            />
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Usar esta imagem'}
          </button>
        </div>
      )}
    </div>
  )
}
