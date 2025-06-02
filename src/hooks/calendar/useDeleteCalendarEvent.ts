import useSWRMutation from 'swr/mutation';

export function useDeleteCalendarEvent(id: string) {
  // Verificar se o ID parece ser um ID válido ou um valor de placeholder
  const isValidId = id && id !== 'no-id-to-delete' && id.trim().length > 0;
  
  // A chave de SWR será null se o ID não for válido, o que evita qualquer chamada à API
  const key = isValidId ? `/api/calendar-event/${id}` : null;
  
  const { trigger, isMutating, error } = useSWRMutation(key, async (url) => {
    // Esta função só será chamada se key não for null
    const res = await fetch(url, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Erro ao deletar evento');
    return res.json();
  });

  return {
    deleteEvent: trigger,
    isDeleting: isMutating,
    error,
  };
}
