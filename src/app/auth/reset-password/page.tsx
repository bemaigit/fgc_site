'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenChecked, setTokenChecked] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  // Verificar se o token é válido ao carregar a página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false)
        setTokenChecked(true)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-token?token=${token}`)
        const data = await response.json()
        
        setTokenValid(data.valid)
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setTokenValid(false)
      } finally {
        setTokenChecked(true)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!password) {
      setError('Senha é obrigatória')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!token) {
      setError('Token de redefinição inválido')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Enviando dados para reset de senha:', { token, passwordLength: password.length })
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
        cache: 'no-store', // Evita problemas de cache
      })

      // Verificar primeiro o formato da resposta
      const responseText = await response.text()
      console.log('Resposta do servidor (texto):', responseText)
      
      let data
      try {
        // Tentar parsear a resposta como JSON
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('Erro ao parsear resposta JSON:', jsonError)
        throw new Error('O servidor retornou uma resposta inválida. Por favor, tente novamente.')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha')
      }

      setSuccess(true)
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      setError(error instanceof Error ? error.message : 'Ocorreu um erro. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Exibir mensagem de carregamento enquanto verifica o token
  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
          <div className="flex flex-col items-center">
            <Image
              src="/images/logo-fgc-dark.png"
              alt="Logo FGC"
              width={120}
              height={34}
              className="w-auto h-[34px]"
              priority
            />
            <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
              Verificando link de redefinição...
            </h2>
          </div>
        </div>
      </div>
    )
  }

  // Se o token for inválido ou expirado
  if (tokenChecked && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
          <div className="flex flex-col items-center">
            <Image
              src="/images/logo-fgc-dark.png"
              alt="Logo FGC"
              width={120}
              height={34}
              className="w-auto h-[34px]"
              priority
            />
            <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
              Link de redefinição inválido ou expirado
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Este link de redefinição de senha é inválido ou expirou. Por favor, solicite um novo link.
            </p>
          </div>
          <div className="text-center mt-4">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-[#7db0de] hover:text-[#08285d]"
            >
              Solicitar nova redefinição
            </Link>
          </div>
          <div className="text-center mt-2">
            <Link
              href="/auth/login"
              className="font-medium text-[#7db0de] hover:text-[#08285d]"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Se a redefinição foi bem-sucedida
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
          <div className="flex flex-col items-center">
            <Image
              src="/images/logo-fgc-dark.png"
              alt="Logo FGC"
              width={120}
              height={34}
              className="w-auto h-[34px]"
              priority
            />
            <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
              Senha redefinida com sucesso!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em alguns segundos.
            </p>
          </div>
          <div className="text-center mt-4">
            <Link
              href="/auth/login"
              className="font-medium text-[#7db0de] hover:text-[#08285d]"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulário de redefinição de senha
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-fgc-dark.png"
            alt="Logo FGC"
            width={120}
            height={34}
            className="w-auto h-[34px]"
            priority
          />
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            Criar nova senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite sua nova senha abaixo.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de] disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Redefinir Senha'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="font-medium text-[#7db0de] hover:text-[#08285d]"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-6 bg-white shadow-md rounded-lg">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-fgc-dark.png"
            alt="Logo FGC"
            width={120}
            height={34}
            className="w-auto h-[34px]"
            priority
          />
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            Verificando link de redefinição...
          </h2>
        </div>
      </div>
    </div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
