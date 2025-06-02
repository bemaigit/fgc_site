'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Token de verificação não fornecido')
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setStatus('success')
          setMessage(data.message || 'Email verificado com sucesso!')
        } else {
          setStatus('error')
          setMessage(data.message || 'Falha ao verificar email')
        }
      } catch (error) {
        console.error('Erro ao verificar email:', error)
        setStatus('error')
        setMessage('Ocorreu um erro ao processar sua solicitação')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mb-4">
                <Image
                  src="/images/logo-fgc-dark.png"
                  alt="Logo FGC"
                  width={120}
                  height={34}
                  className="w-auto h-[34px] mx-auto"
                  priority
                />
              </div>
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#7db0de] border-r-transparent mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800">Verificando seu email...</h2>
              <p className="mt-2 text-gray-600">Aguarde enquanto processamos sua solicitação.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4">
                <Image
                  src="/images/logo-fgc-dark.png"
                  alt="Logo FGC"
                  width={120}
                  height={34}
                  className="w-auto h-[34px] mx-auto"
                  priority
                />
              </div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Email verificado!</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-gray-600">Sua conta foi ativada e você já pode acessar o sistema.</p>
              <div className="mt-6">
                <Link 
                  href="/auth/login" 
                  className="bg-[#08285d] hover:bg-[#7db0de] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                >
                  Fazer Login
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4">
                <Image
                  src="/images/logo-fgc-dark.png"
                  alt="Logo FGC"
                  width={120}
                  height={34}
                  className="w-auto h-[34px] mx-auto"
                  priority
                />
              </div>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Verificação falhou</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 flex flex-col space-y-3">
                <Link 
                  href="/auth/login" 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                >
                  Ir para Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="text-[#7db0de] hover:text-[#08285d] font-medium"
                >
                  Criar nova conta
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <Image
              src="/images/logo-fgc-dark.png"
              alt="Logo FGC"
              width={120}
              height={34}
              className="w-auto h-[34px] mx-auto"
              priority
            />
          </div>
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#7db0de] border-r-transparent mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Verificando seu email...</h2>
          <p className="mt-2 text-gray-600">Aguarde enquanto processamos sua solicitação.</p>
        </div>
      </div>
    </div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
