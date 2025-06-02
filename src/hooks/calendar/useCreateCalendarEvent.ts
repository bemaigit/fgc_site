import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';

// Tipar o argumento para aceitar qualquer objeto (evento)
export function useCreateCalendarEvent() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/calendar-event',
    async (url: string, { arg }: { arg: any }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!res.ok) throw new Error('Erro ao criar evento');
      return res.json();
    }
  );

  return {
    createEvent: trigger,
    isCreating: isMutating,
    error,
  };
}
