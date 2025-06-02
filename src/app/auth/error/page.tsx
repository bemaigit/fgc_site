'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const [errorMessage, setErrorMessage] = useState('')
  const [errorType, setErrorType] = useState<'email_not_verified' | 'credentials' | 'other'>('other')

  useEffect(() => {
    // Mapear códigos de erro para mensagens amigáveis
    if (error === 'EMAIL_NOT_VERIFIED') {
      setErrorMessage('Seu email ainda não foi verificado. Por favor, verifique sua caixa de entrada e clique no link de confirmação.')
      setErrorType('email_not_verified')
    } else if (error === 'CredentialsSignin') {
      setErrorMessage('Email ou senha inválidos. Verifique suas credenciais e tente novamente.')
      setErrorType('credentials')
    } else {
      setErrorMessage('Ocorreu um erro durante a autenticação. Por favor, tente novamente.')
      setErrorType('other')
    }
  }, [error])

  // Função para solicitar reenvio do email
  const handleResendEmail = async () => {
    // Implementação futura para reenviar o email
    alert('Funcionalidade de reenvio ainda não implementada. Por favor, verifique seu email ou entre em contato com o suporte.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Image
            src="/images/logo-fgc-dark.png"
            alt="Logo FGC"
            width={120}
            height={34}
            className="w-auto h-[34px]"
            priority
          />
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            Erro de Autenticação
          </h2>
        </div>
        
        <div className={`mt-4 p-4 rounded-md ${
          errorType === 'email_not_verified' 
            ? 'bg-blue-50 border border-blue-200 text-blue-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {errorType === 'email_not_verified' ? (
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          </div>
        </div>
        
        {errorType === 'email_not_verified' && (
          <div className="mt-6 space-y-4">
            <button
              onClick={handleResendEmail}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
            >
              Reenviar Email de Verificação
            </button>
            <p className="text-xs text-center text-gray-600">
              Se você não recebeu o email de verificação, verifique sua pasta de spam ou entre em contato com o suporte.
            </p>
          </div>
        )}
        
        <div className="mt-6 flex flex-col space-y-3">
          <Link 
            href="/auth/login" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Voltar para Login
          </Link>
          
          {errorType !== 'email_not_verified' && (
            <Link 
              href="/auth/forgot-password" 
              className="text-center text-sm font-medium text-yellow-600 hover:text-yellow-500"
            >
              Esqueceu sua senha?
            </Link>
          )}
          
          <Link 
            href="/" 
            className="text-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
