import useSWRMutation from 'swr/mutation';

export function useUpdateCalendarEvent(id: string) {
  const { trigger, isMutating, error } = useSWRMutation(`/api/calendar-event/${id}`, async (url, { arg }: { arg: any }) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arg),
    });
    if (!res.ok) throw new Error('Erro ao atualizar evento');
    return res.json();
  });

  return {
    updateEvent: trigger,
    isUpdating: isMutating,
    error,
  };
}
