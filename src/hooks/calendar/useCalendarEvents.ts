'use client';

import { useState, useEffect } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startdate: string;
  enddate: string;
  location: string;
  type: string;
  status: string;
  imageurl?: string;
  city: string;
  uf: string;
  modality: string;
  category: string;
  highlight: boolean;
  website: string;
  regulationpdf: string;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Erro ao buscar eventos do calendário');
  return res.json();
});

export function useCalendarEvents() {
  const [data, setData] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetcher('/api/calendar-event');
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setIsValidating(false);
      }
    };

    fetchData();
  }, []);

  const mutate = async () => {
    setIsValidating(true);
    try {
      const result = await fetcher('/api/calendar-event');
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setIsValidating(false);
    }
  };

  return {
    events: data,
    isLoading: isValidating && !data,
    isError: !!error,
    mutate,
  };
}
