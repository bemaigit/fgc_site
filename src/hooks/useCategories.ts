import { useState, useEffect } from 'react'

export interface Category {
  id: string
  name: string
  modalityId: string
  modalityName: string
  active: boolean
  description?: string
}

export function useCategories(modalityId?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Se não tiver modalidade selecionada, não faz a busca
    if (!modalityId) {
      setCategories([])
      return
    }

    const fetchCategories = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Busca todas as categorias e filtra pelo modalityId no cliente
        const response = await fetch('/api/rankings/categories')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar categorias')
        }
        
        const data = await response.json()
        
        // Filtra as categorias pela modalidade selecionada
        // Se modalityId for 'ALL', retorna todas as categorias
        const filteredCategories = modalityId === 'ALL' 
          ? data.data || data 
          : (data.data || data).filter(
              (category: Category) => category.modalityId === modalityId
            )
        
        setCategories(filteredCategories)
      } catch (err) {
        console.error('Erro ao buscar categorias:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [modalityId])

  return { categories, isLoading, error }
}
