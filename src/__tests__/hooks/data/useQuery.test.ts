import { renderHook, act } from '@testing-library/react'
import { useQuery } from '@/hooks/data/useQuery'

describe('useQuery', () => {
  it('deve buscar dados com sucesso', async () => {
    const { result } = renderHook(() => useQuery({
      table: 'news',
      select: '*'
    }))

    // Inicialmente está carregando
    expect(result.current.loading).toBe(true)
    
    // Espera a requisição terminar
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Verifica o resultado
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeTruthy()
    expect(result.current.error).toBeNull()
  })

  it('deve aplicar filtros corretamente', async () => {
    const { result } = renderHook(() => useQuery({
      table: 'news',
      select: '*',
      filters: {
        category: 'eventos'
      }
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeTruthy()
  })

  it('deve paginar corretamente', async () => {
    const { result } = renderHook(() => useQuery({
      table: 'news',
      select: '*',
      limit: 10,
      page: 1
    }))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeTruthy()
    expect(result.current.pageCount).toBeGreaterThan(0)
  })
})
