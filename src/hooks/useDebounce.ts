import { useEffect, useState } from 'react'

/**
 * Hook que retorna um valor debounced (atrasado)
 * @param value Valor a ser debounced
 * @param delay Tempo de atraso em milissegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Configurar o timer de debounce
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: limpar o timer se o valor mudar antes do delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
