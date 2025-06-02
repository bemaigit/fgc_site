'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function AuthNavButtons() {
  const { data: session, status } = useSession()
  
  // Log de depuração - será exibido no console
  console.log('⚠️ AUTH DEBUG - Session:', session)
  console.log('⚠️ AUTH DEBUG - Status:', status)
  console.log('⚠️ AUTH DEBUG - User:', session?.user)
  console.log('⚠️ AUTH DEBUG - Is authenticated:', status === 'authenticated')
  
  // Se não estiver autenticado, mostrar botão de login
  if (status !== 'authenticated' || !session) {
    return (
      <Link
        href="/auth/login"
        className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de]"
      >
        Entrar <span aria-hidden="true">&rarr;</span>
      </Link>
    )
  }
  
  // Se estiver autenticado, mostrar botões de navegação
  return (
    <>
      {/* Botão Meu Perfil - SEMPRE para usuários autenticados */}
      <Link
        href="/dashboard/meu-perfil"
        className="text-sm font-semibold leading-6 text-white bg-[#7db0de] px-4 py-2 rounded-md hover:bg-[#08285d]"
      >
        Meu Perfil
      </Link>
      
      {/* Botão Dashboard - verificar se é admin ou super_admin */}
      {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão Sair */}
      <Link
        href="/auth/logout"
        className="text-sm font-semibold leading-6 text-white bg-[#08285d] px-4 py-2 rounded-md hover:bg-[#7db0de] ml-2"
      >
        Sair
      </Link>
    </>
  )
}

export function AuthNavButtonsMobile({ onItemClick }: { onItemClick: () => void }) {
  const { data: session, status } = useSession()
  
  // Log de depuração - será exibido no console
  console.log('⚠️ AUTH DEBUG (Mobile) - Status:', status)
  
  // Se não estiver autenticado, mostrar botão de login
  if (status !== 'authenticated' || !session) {
    return (
      <Link
        href="/auth/login"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Entrar
      </Link>
    )
  }
  
  // Se estiver autenticado, mostrar botões de navegação
  return (
    <>
      {/* Botão Meu Perfil - SEMPRE para usuários autenticados */}
      <Link
        href="/dashboard/meu-perfil"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Meu Perfil
      </Link>
      
      {/* Botão Dashboard - verificar se é admin ou super_admin */}
      {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
        <Link
          href="/dashboard"
          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
          onClick={onItemClick}
        >
          Dashboard
        </Link>
      )}
      
      {/* Botão Sair */}
      <Link
        href="/auth/logout"
        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
        onClick={onItemClick}
      >
        Sair
      </Link>
    </>
  )
}
