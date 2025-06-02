import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventPricing } from '@/types/events'
import { validatePricingTierDates, validatePricingTiersWithinEventDates, EventValidationError } from '@/utils/event-validations'
import { useEventBasicInfo } from './useEventBasicInfo'
import { useToasts } from '@/hooks/ui/useToasts'

interface UseEventPricingProps {
  eventId: string | null | undefined
}

export function useEventPricing({ eventId }: UseEventPricingProps) {
  const queryClient = useQueryClient()
  const { data: basicInfo } = useEventBasicInfo({ eventId })
  const { showError, showSuccess } = useToasts()

  const getPricing = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/pricing`)
    if (!response.ok) throw new Error('Failed to fetch pricing')
    
    const { data } = await response.json()
    return data as EventPricing
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-pricing', eventId],
    queryFn: getPricing,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updatePricing, isPending: isUpdating } = useMutation({
    mutationFn: async (pricingData: Partial<EventPricing>) => {
      if (!eventId) throw new Error('Event ID is required')
      if (!basicInfo?.startDate || !basicInfo?.endDate) {
        throw new Error('As datas do evento precisam ser definidas antes de configurar os lotes')
      }

      // Converte price para número antes de enviar
      if (pricingData.pricingTiers) {
        pricingData.pricingTiers = pricingData.pricingTiers.map(tier => ({
          ...tier,
          price: typeof tier.price === 'string' ? Number(tier.price) : tier.price,
          maxEntries: tier.maxEntries ? Number(tier.maxEntries) : null
        }))

        try {
          // Validar as datas dos lotes
          validatePricingTierDates(pricingData.pricingTiers)
          
          // Validar que os lotes estão dentro do período do evento
          validatePricingTiersWithinEventDates(
            pricingData.pricingTiers,
            basicInfo.startDate,
            basicInfo.endDate
          )
        } catch (error) {
          if (error instanceof EventValidationError) {
            throw new Error(error.message)
          }
          throw error
        }
      }

      const response = await fetch(`/api/events/${eventId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData)
      })

      if (!response.ok) throw new Error('Failed to update pricing')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-pricing', eventId] })
      showSuccess({
        title: 'Lotes atualizados',
        description: 'Os lotes do evento foram atualizados com sucesso.'
      })
    },
    onError: (error: Error) => {
      showError({
        title: 'Erro ao atualizar lotes',
        description: error.message || 'Não foi possível atualizar os lotes do evento.'
      })
    }
  })

  return {
    data,
    isLoading,
    updatePricing,
    isUpdating
  }
}
