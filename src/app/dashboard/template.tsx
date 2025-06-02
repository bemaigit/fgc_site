'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Verificar se o usuário está na página de perfil
  const isProfilePage = pathname === '/dashboard/meu-perfil' || pathname.startsWith('/dashboard/meu-perfil/')
  
  // Verificar se o usuário é admin ou super_admin
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    
    // Se não é a página de perfil e não tem permissão adequada, redireciona para home
    if (!isProfilePage && 
        status === 'authenticated' && 
        (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN'))) {
      router.push('/')
    }
  }, [status, session, router, pathname, isProfilePage])

  // Mostra loading enquanto verifica a autenticação
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Não mostra nada se não estiver autenticado
  if (status === 'unauthenticated') {
    return null
  }

  // Permite acesso à página de perfil para qualquer usuário autenticado
  // Não mostra nada se não tiver permissão e não estiver na página de perfil
  if (!isProfilePage && (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN'))) {
    return null
  }

  // Se é a página de perfil e o usuário NÃO é admin, usar layout simplificado sem sidebar e header
  if (isProfilePage && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          {children}
        </div>
      </div>
    );
  }

  // Layout normal do dashboard para admins e super_admins
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
