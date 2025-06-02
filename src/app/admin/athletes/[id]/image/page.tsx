'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/athlete/ImageUpload'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

// Interface para o tipo de retorno da API
interface AthleteWithImage {
  id: string
  fullName: string
  image: string | null
}

export default function AthleteImagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [athlete, setAthlete] = useState<AthleteWithImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Buscar dados do atleta
  useEffect(() => {
    async function fetchAthlete() {
      try {
        const response = await fetch(`/api/athletes/${params.id}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Não foi possível carregar os dados do atleta')
        }
        const data: AthleteWithImage = await response.json()
        setAthlete(data)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Erro desconhecido ao carregar os dados do atleta')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAthlete()
  }, [params.id])

  const handleImageUploadSuccess = (imageUrl: string) => {
    // Atualizar o estado local
    if (athlete) {
      setAthlete({
        ...athlete,
        image: imageUrl
      })
    }
    
    // Mostrar mensagem de sucesso
    setSaveSuccess(true)
    
    // Esconder a mensagem após 3 segundos
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  const handleReturn = () => {
    router.push(`/admin/athletes/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error || !athlete) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">{error || 'Atleta não encontrado'}</div>
        <Link 
          href="/admin/athletes" 
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista de atletas
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Gerenciar Imagem do Atleta</h1>
        <button
          onClick={handleReturn}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">{athlete.fullName}</h2>
        
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
            <Save className="w-5 h-5 mr-2" />
            Imagem atualizada com sucesso!
          </div>
        )}
        
        <div className="flex flex-col items-center">
          <ImageUpload 
            athleteId={athlete.id} 
            currentImage={athlete.image}
            onSuccess={handleImageUploadSuccess}
          />
          
          <div className="mt-8 text-gray-500 text-sm">
            <p>A imagem será redimensionada para 300x300 pixels e otimizada automaticamente.</p>
            <p>Formatos aceitos: JPG, PNG, GIF</p>
            <p>Tamanho máximo: 5MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}
