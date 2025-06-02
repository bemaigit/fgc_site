import { useState, useEffect } from 'react'

interface Modality {
  id: string
  name: string
  active: boolean
  description?: string
}

export function useModalities() {
  const [modalities, setModalities] = useState<Modality[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchModalities = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/rankings/modalities')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar modalidades')
        }
        
        const data = await response.json()
        setModalities(data)
      } catch (err) {
        console.error('Erro ao buscar modalidades:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar modalidades')
      } finally {
        setIsLoading(false)
      }
    }

    fetchModalities()
  }, [])

  return { modalities, isLoading, error }
}
