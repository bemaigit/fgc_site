import useSWR from 'swr'

export interface EventModality {
  id: string
  name: string
  description?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Falha ao carregar modalidades')
  return r.json()
})

export function useEventModalities(activeOnly: boolean = false) {
  const queryParams = activeOnly ? '?active=true' : ''
  const { data, error, isLoading } = useSWR<EventModality[]>(
    `/api/events/modalities${queryParams}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000 // 10 segundos
    }
  )

  return {
    data: data || [],
    isLoading,
    error: error?.message || null
  }
}
