'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email é obrigatório')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email inválido')
      return
    }

    try {
      setError('')
      
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }
      
      // Mesmo que o email não exista, mostramos mensagem de sucesso por segurança
      setSuccess(true)
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error)
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <Image
              src="/images/logo-fgc-dark.png"
              alt="Logo FGC"
              width={120}
              height={34}
              className="w-auto h-[34px]"
              priority
            />
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Email enviado!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Verifique sua caixa de entrada para instruções sobre como redefinir sua senha.
            </p>
          </div>
          <div className="text-center">
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

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-fgc-dark.png"
            alt="Logo FGC"
            width={120}
            height={34}
            className="w-auto h-[34px]"
            priority
          />
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Recuperar senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite seu email para receber instruções de recuperação de senha.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
            >
              Enviar instruções
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
