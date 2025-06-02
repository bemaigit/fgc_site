import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/core/useAuth'

describe('useAuth', () => {
  it('deve iniciar com loading true', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('deve fazer login com sucesso', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signIn('teste@exemplo.com', 'senha123')
    })

    expect(result.current.user).toBeTruthy()
    expect(result.current.loading).toBe(false)
  })

  it('deve fazer logout com sucesso', async () => {
    const { result } = renderHook(() => useAuth())

    // Primeiro faz login
    await act(async () => {
      await result.current.signIn('teste@exemplo.com', 'senha123')
    })

    // Depois faz logout
    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
