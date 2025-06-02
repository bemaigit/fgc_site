'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Upload, Check, X, RefreshCw } from 'lucide-react'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'

interface ImageUploadProps {
  athleteId: string
  currentImage?: string | null
  onSuccess?: (imageUrl: string) => void
}

export function ImageUpload({ athleteId, currentImage, onSuccess }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Processar a URL da imagem atual quando o componente for montado ou quando currentImage mudar
  useEffect(() => {
    // Usar o processador de URL para garantir que a imagem seja exibida corretamente
    const processedUrl = currentImage ? processProfileImageUrl(currentImage) : null
    setPreview(processedUrl)
  }, [currentImage])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo e tamanho
    if (!file.type.includes('image/')) {
      setError('O arquivo deve ser uma imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter menos de 5MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setSuccess(false)

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Preparar para upload
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`/api/athletes/${athleteId}/upload-image`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload da imagem')
      }


      setSuccess(true)
      if (onSuccess) {
        onSuccess(data.imageUrl)
      }
      
      // Resetar o input de arquivo para permitir fazer upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (err: any) {
      console.error('Erro no upload da imagem:', err)
      const errorMessage = err.message || 'Erro ao fazer upload da imagem. Por favor, tente novamente.'
      setError(errorMessage)
      
      // Se houver uma imagem atual, restaurar a visualização
      if (currentImage) {
        setPreview(processProfileImageUrl(currentImage))
      } else {
        setPreview(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const resetUpload = () => {
    // Usar a função auxiliar para processar corretamente a URL
    setPreview(currentImage ? processProfileImageUrl(currentImage) : null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-xs">
      <div 
        className={`
          w-32 h-32 relative rounded-full overflow-hidden border-2 
          ${error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300'}
          mx-auto mb-4 cursor-pointer hover:opacity-90 transition-opacity
        `}
        onClick={triggerFileInput}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Preview da imagem"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-500" />
          </div>
        )}

        {/* Ícone de status */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {success && (
          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
            <Check className="w-5 h-5 text-white" />
          </div>
        )}

        {error && (
          <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1">
            <X className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="text-red-500 text-sm text-center mb-2">{error}</div>
      )}

      {/* Botões de ação */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={triggerFileInput}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          disabled={isUploading}
        >
          {currentImage ? 'Alterar imagem' : 'Selecionar imagem'}
        </button>
        
        {preview && preview !== currentImage && (
          <button
            type="button"
            onClick={resetUpload}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 transition-colors"
            disabled={isUploading}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Input de arquivo escondido */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
