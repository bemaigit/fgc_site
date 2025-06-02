'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PasswordInput } from '@/components/auth/PasswordInput'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '', // Novo campo para o número de WhatsApp
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos os campos obrigatórios precisam ser preenchidos')
      setIsLoading(false)
      return
    }
    
    // Validação do número de telefone (opcional, mas se fornecido, deve estar no formato correto)
    if (formData.phone && !/^\(?\d{2}\)?[\s\-]?\d{4,5}[\s\-]?\d{4}$/.test(formData.phone)) {
      setError('Formato de telefone inválido. Use (XX) XXXXX-XXXX')
      setIsLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email inválido')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone, // Enviando o número de telefone para a API
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta')
      }

      // Em vez de redirecionar, mostrar mensagem de verificação
      setIsRegistered(true)
      setRegisteredEmail(formData.email)
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  // Se o usuário está registrado, mostrar mensagem de verificação
  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center py-4">
        <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 relative mb-4">
              <Image
                src="/images/logo.png"
                alt="Logo da FGC"
                layout="fill"
                objectFit="contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900">Cadastro Realizado!</h2>
          </div>
          
          <div className="rounded-md bg-blue-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  Enviamos um link de verificação para <strong>{registeredEmail}</strong>. 
                  Por favor, verifique seu email para ativar sua conta antes de fazer login.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-center">
              Não recebeu o email? Verifique sua pasta de spam ou
              <button 
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => router.push('/auth/login')}
              >
                tente fazer login
              </button>
            </p>
            
            <div className="mt-4 flex justify-center">
              <Link 
                href="/auth/login" 
                className="bg-[#08285d] hover:bg-[#7db0de] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
              >
                Ir para Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/auth/login" className="font-medium text-[#7db0de] hover:text-[#08285d]">
              entrar na sua conta existente
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de] focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de] focus:z-10 sm:text-sm"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">WhatsApp</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#7db0de] focus:border-[#7db0de] focus:z-10 sm:text-sm"
                placeholder="WhatsApp (opcional) - (XX) XXXXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <PasswordInput
                id="password"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processando...' : 'Criar Conta'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="font-medium text-[#7db0de] hover:text-[#08285d]">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
