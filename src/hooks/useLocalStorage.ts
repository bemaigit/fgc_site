'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Função para obter o valor inicial do localStorage ou usar o valor padrão
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }, [initialValue, key])

  // Estado para armazenar o valor atual
  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Função para atualizar o valor no localStorage e no estado
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key "${key}" even though environment is not a client`)
    }

    try {
      // Permite value ser uma função para imitar a API do useState
      const newValue = value instanceof Function ? value(storedValue) : value

      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(newValue))

      // Salva no estado
      setStoredValue(newValue)
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Sincroniza com outros tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue] as const
}
