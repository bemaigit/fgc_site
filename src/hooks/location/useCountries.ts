import { useState, useEffect } from 'react'

export type Country = {
  id: string
  name: string
  code?: string
}

export function useCountries(setLoading?: (state: any) => void) {
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    // Definir o estado de carregamento como true
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, countries: true }))
    }

    // Adicionar Brasil como único país disponível
    setCountries([{ id: '1', name: 'Brasil', code: 'BR' }])

    // Definir o estado de carregamento como false
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, countries: false }))
    }
  }, [setLoading])

  return { countries }
}
