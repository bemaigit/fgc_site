'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, Upload, Trash2, Check, Image as ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function GerenciarBannerPage() {
  const router = useRouter()
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Buscar banner atual
  useEffect(() => {
    const fetchCurrentBanner = async () => {
      try {
        const response = await fetch('/api/banner/calendar')
        if (response.ok) {
          const data = await response.json()
          if (data.bannerUrl) {
            setCurrentBannerUrl(data.bannerUrl)
          }
        }
      } catch (err) {
        console.error('Erro ao buscar banner atual:', err)
      }
    }

    fetchCurrentBanner()
  }, [])

  // Lidar com seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setBannerImage(file)

    if (file) {
      const fileReader = new FileReader()
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string)
      }
      fileReader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  // Limpar seleção
  const handleClearSelection = () => {
    setBannerImage(null)
    setPreviewUrl(null)
  }

  // Fazer upload do banner
  const handleUploadBanner = async () => {
    if (!bannerImage) {
      setError('Nenhuma imagem selecionada')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('image', bannerImage)

      const response = await fetch('/api/banner/calendar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Erro ao fazer upload do banner')
      }

      const data = await response.json()
      setCurrentBannerUrl(data.bannerUrl)
      setSuccess('Banner atualizado com sucesso!')
      setBannerImage(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Falha ao enviar imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => router.push('/dashboard/calendario')}
          className="text-[#08285d] hover:text-[#7db0de] p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Banner do Calendário</h1>
      </div>

      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Seção do banner atual */}
      <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
        <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg font-medium text-gray-800">Banner Atual</h2>
        </div>

        <div className="p-6">
          {currentBannerUrl ? (
            <div className="space-y-4">
              <div className="relative h-[250px] w-full bg-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={currentBannerUrl}
                  alt="Banner atual do calendário"
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">URL:</span>
                <span className="text-sm font-mono text-gray-700 truncate max-w-md">
                  {currentBannerUrl}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={currentBannerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 flex items-center"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Ver em tamanho real
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <ImageIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sem banner definido</h3>
              <p className="mt-1 text-sm text-gray-500">
                Faça upload de uma imagem para servir como banner do calendário público.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção de upload de novo banner */}
      <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
        <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg font-medium text-gray-800">Atualizar Banner</h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Selecionar nova imagem para o banner
            </label>

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative h-[250px] w-full bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview do novo banner"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover seleção
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadBanner}
                    disabled={isUploading}
                    className="px-4 py-2 bg-[#08285d] text-white rounded-md hover:bg-[#7db0de] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Fazer upload'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-[#08285d] hover:text-[#7db0de] focus-within:outline-none"
                    >
                      <span>Escolha uma imagem</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 5MB. Recomendamos imagens de alta resolução com proporção 16:9.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500">
              <p>Recomendações para o banner:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Use imagens de alta qualidade e boa resolução (recomendado: pelo menos 1600x900px)</li>
                <li>Escolha fotos representativas do ciclismo em Goiás</li>
                <li>Evite texto na imagem, pois será sobreposto pelo título "CALENDÁRIO"</li>
                <li>A imagem será cortada automaticamente para ajustar às proporções, mantenha os elementos principais no centro</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
