import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface UseEventSlugValidationProps {
  eventId?: string | null
  onValidationChange?: (isValid: boolean) => void
}

interface SlugValidationResponse {
  available: boolean
  message?: string
}

export function useEventSlugValidation({ eventId, onValidationChange }: UseEventSlugValidationProps = {}) {
  // Estado para controlar a validação (não usado na versão temporária)
  const [currentSlug, setCurrentSlug] = useState<string>('')
  const debouncedSlug = useDebounce(currentSlug, 500)

  // Query para verificar se um slug já existe (simulada temporariamente)
  const { data } = useQuery<SlugValidationResponse>({
    queryKey: ['event-slug-validation', debouncedSlug, eventId],
    queryFn: async () => {
      if (!debouncedSlug) return { available: true }

      try {
        // Simulação temporária da validação até que a API esteja pronta
        // Remova este bloco quando a API estiver implementada
        return { available: true, message: 'URL disponível' };
        
        // Código original comentado até que a API esteja disponível
        /*
        const params = new URLSearchParams()
        if (eventId) {
          params.append('currentEventId', eventId)
        }
        params.append('slug', debouncedSlug)

        const response = await fetch(`/api/events/validate-slug?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Erro ao validar URL personalizada')
        }

        return response.json()
        */
      } catch (error) {
        console.error('Erro ao validar slug:', error);
        return { available: true }; // Fallback para evitar bloqueio do formulário
      }
    },
    enabled: Boolean(debouncedSlug),
    retry: false
  })

  // Efeito para chamar onValidationChange quando os dados mudarem
  useEffect(() => {
    if (data && onValidationChange) {
      onValidationChange(data.available);
    }
  }, [data, onValidationChange]);

  // Função para validar um slug
  const validateSlug = async (slug: string) => {
    if (!slug) {
      if (onValidationChange) {
        onValidationChange(true)
      }
      return true
    }

    try {
      setCurrentSlug(slug)
      return true // Temporariamente retornando sempre true até que a API esteja pronta
    } catch (error) {
      console.error('Erro ao validar slug:', error)
      return true // Fallback para evitar bloqueio do formulário
    }
  }

  return {
    validateSlug,
    isValidating: false, // Forçando como false para evitar o carregamento infinito
    isAvailable: true, // Temporariamente sempre disponível
    validationMessage: 'URL disponível',
    error: null
  }
}
