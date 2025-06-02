import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventBasicInfo } from '@/types/events'

interface UseEventBasicInfoProps {
  eventId: string | null | undefined
}

export function useEventBasicInfo({ eventId }: UseEventBasicInfoProps) {
  const queryClient = useQueryClient()

  const getBasicInfo = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/basic`)
    if (!response.ok) throw new Error('Failed to fetch basic info')
    
    const { data } = await response.json()
    return data as EventBasicInfo
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-basic-info', eventId],
    queryFn: getBasicInfo,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updateBasicInfo, isPending: isUpdating } = useMutation({
    mutationFn: async (basicData: Partial<EventBasicInfo>) => {
      if (!eventId) throw new Error('Event ID is required')

      const response = await fetch(`/api/events/${eventId}/basic`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicData)
      })

      if (!response.ok) throw new Error('Failed to update basic info')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-basic-info', eventId] })
    }
  })

  return {
    data,
    isLoading,
    updateBasicInfo,
    isUpdating
  }
}
