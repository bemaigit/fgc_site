import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { EventTopResultsResponse } from '@/types/event-top-result';

export function useEventTopResults(eventId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<EventTopResultsResponse>(
    eventId ? `/api/events/${eventId}/top-results` : null,
    fetcher
  );

  return {
    data: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
