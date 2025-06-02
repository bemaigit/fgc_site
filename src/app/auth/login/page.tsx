'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { PasswordInput } from '@/components/auth/PasswordInput'

// Página principal com Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="relative h-20 w-20">
              <Image src="/images/logo-fgc.png" alt="FGC Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Carregando...</h1>
            <p className="text-sm text-muted-foreground">Aguarde enquanto preparamos a página de login</p>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side
function LoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    console.log('Login: Iniciando tentativa de login com:', { email: formData.email })

    try {
      // Primeiro, verificamos as credenciais sem redirecionar
      console.log('Login: Chamando signIn...')
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: '/' // Adiciona uma URL de callback
      })
      console.log('Login: Resultado do signIn:', result)

      if (result?.error) {
        console.error('Login: Erro retornado pelo signIn:', result.error)
        
        // Mensagem específica para email não verificado
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Seu email ainda não foi verificado. Por favor, verifique sua caixa de entrada e clique no link de verificação enviado para o seu email.')
        } else {
          setError(`Erro ao autenticar: ${result.error}`)
        }
        
        setIsLoading(false)
        return
      }

      // Se o login foi bem-sucedido, fazemos uma verificação do perfil do usuário
      const response = await fetch('/api/auth/session')
      const session = await response.json()

      // Redirecionamento com base no papel do usuário
      if (session?.user?.role === 'SUPER_ADMIN') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/'
      }
      
    } catch (err) {
      console.error("Erro ao fazer login:", err)
      setError('Ocorreu um erro ao fazer login')
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-4">
      <div className="max-w-md w-full space-y-4">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-fgc-dark.png"
            alt="Logo FGC"
            width={120}
            height={34}
            className="w-auto h-[34px]"
            priority
          />
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Entrar na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/auth/register" className="font-medium text-[#7db0de] hover:text-[#08285d]">
              criar uma nova conta
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#08285d] focus:border-[#08285d] sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-medium text-[#7db0de] hover:text-[#08285d]">
                    Esqueci minha senha
                  </Link>
                </div>
              </div>
              <PasswordInput
                id="password"
                hideLabel={true}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Sua senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#0a3272] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08285d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
