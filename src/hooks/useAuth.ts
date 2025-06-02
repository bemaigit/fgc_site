import { useSession } from 'next-auth/react'
import { Role } from '@prisma/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

type UseAuthOptions = {
  required?: boolean
  requiredRole?: Role
  redirectTo?: string
  queryParams?: Record<string, string>
}

export function useAuth(options: UseAuthOptions = {}) {
  const {
    required = true,
    requiredRole,
    redirectTo = '/auth/login',
    queryParams = {}
  } = options

  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const user = session?.user
  
  // Verifica se o usuário tem a role necessária
  const hasRequiredRole = !requiredRole || user?.role === requiredRole
  const hasAdminAccess = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  
  useEffect(() => {
    if (isLoading) return

    if (required && !isAuthenticated) {
      // Preserva a URL atual para redirecionamento após login
      const searchParams = new URLSearchParams({
        ...queryParams,
        callbackUrl: pathname
      })
      
      router.push(`${redirectTo}?${searchParams.toString()}`)
      return
    }

    if (requiredRole && !hasRequiredRole) {
      router.push('/')
      return
    }
  }, [isAuthenticated, isLoading, required, requiredRole, hasRequiredRole, pathname, redirectTo, router])
  
  return {
    user,
    isAuthenticated,
    isLoading,
    role: user?.role,
    hasRequiredRole,
    hasAdminAccess
  }
}
